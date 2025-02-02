import logging
from src.authentication.api_key_authorization import api_key_auth
from src.authentication.token import verify_token, verify_token_or_api_key
from src.data.database.checkAPIKey import check_api_key
from src.data.dataFetch.youtube import youtube_transcript
from src.endpoint.deleteStore import delete_vectorstore_collection
from src.endpoint.models import EmbeddingRequest, QueryRequest, ChatCompletionRequest, VectorStoreQueryRequest, DeleteCollectionRequest, YoutubeTranscriptRequest, WebCrawlRequest, ModelLoadRequest
from src.endpoint.embed import embed
from src.endpoint.vectorQuery import query_vectorstore
from src.endpoint.devApiCall import rag_call, llm_call, vector_call
from src.endpoint.transcribe import transcribe_audio
from src.endpoint.webcrawl import webcrawl
from src.models.manager import model_manager
from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio
import os
import signal
import sys
import psutil
import threading
import uvicorn
import json
from src.endpoint.api import chat_completion_stream
app = FastAPI()
embedding_task = None
embedding_event = None
crawl_task = None
crawl_event = None

origins = ["http://localhost", "http://127.0.0.1"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)


@app.post("/chat/completions")
async def chat_completion(request: ChatCompletionRequest, user_id: str = Depends(verify_token_or_api_key)) -> StreamingResponse:
    """Stream chat completion from the model"""
    print("Chat completion request received")
    print(user_id, request)
    info = model_manager.get_model_info()
    print(info)
    if request.model != info["model_name"]:
        model_load_request = ModelLoadRequest(
            model_name=request.model)
        model, tokenizer = model_manager.load_model(model_load_request)
        print("Model mismatch")
        return {"status": "error", "message": "Model mismatch"}
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    print("Authorized")
    print(request)
    return StreamingResponse(
        chat_completion_stream(request),
        media_type="text/event-stream"
    )


@app.get("/model-info")
async def get_model_info(user_id: str = Depends(verify_token_or_api_key)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    """Get information about the currently loaded model"""
    return JSONResponse(content=model_manager.get_model_info())


@app.post("/load-model")
async def load_model_endpoint(request: ModelLoadRequest, user_id: str = Depends(verify_token_or_api_key)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    """Load a model with the specified configuration"""
    print("Loading model")
    print(request)
    model_type = request.model_type or "auto"
    if model_type != "auto":
        is_compatible, message = model_manager.check_platform_compatibility(
            model_type)
        logger.info(f"is_compatible: {is_compatible}, message: {message}")
        # Return early if platform is not compatible
        if not is_compatible:
            response_data = model_manager._make_json_serializable({
                "status": "error",
                "message": f"Cannot load model: {message}",
                "model_info": model_manager.get_model_info()
            })
            return JSONResponse(content=response_data)
    try:
        model, tokenizer = model_manager.load_model(request)
        response_data = model_manager._make_json_serializable({
            "status": "success",
            "message": f"Successfully loaded model {request.model_name}",
            "model_info": model_manager.get_model_info()
        })
        print(response_data)
        logger.info(response_data)
        return JSONResponse(content=response_data)
    except Exception as e:
        response_data = model_manager._make_json_serializable({
            "status": "error",
            "message": str(e),
            "model_info": model_manager.get_model_info()
        })
        return JSONResponse(status_code=500, content=response_data)


@app.post("/unload-model")
async def unload_model_endpoint(user_id: str = Depends(verify_token_or_api_key)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    """Unload the currently loaded model"""

    try:
        model_manager.clear_model()
        return JSONResponse(content={
            "status": "success",
            "message": "Model unloaded successfully",
            "model_info": model_manager.get_model_info()
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "model_info": model_manager.get_model_info()
            }
        )


@app.post("/webcrawl")
async def webcrawl_endpoint(data: WebCrawlRequest, user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}

    global crawl_task, crawl_event
    if crawl_task is not None:
        return {"status": "error", "message": "A crawl process is already running"}

    crawl_event = asyncio.Event()

    async def event_generator():
        global crawl_task, crawl_event
        try:
            for result in webcrawl(data, crawl_event):
                if crawl_event.is_set():
                    yield f"data: {{'type': 'cancelled', 'message': 'Crawl process cancelled'}}\n\n"
                    break
                yield f"{result}\n\n"
                await asyncio.sleep(0.1)
        except Exception as e:
            error_data = {
                "status": "error",
                "data": {
                    "message": str(e)
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        finally:
            crawl_task = None
            crawl_event = None

    response = StreamingResponse(
        event_generator(), media_type="text/event-stream")
    crawl_task = asyncio.create_task(event_generator().__anext__())
    return response


@app.post("/transcribe")
async def transcribe_audio_endpoint(audio_file: UploadFile = File(...), model_name: str = "base", user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    return await transcribe_audio(audio_file, model_name)


@app.post("/embed")
async def add_embedding(data: EmbeddingRequest, user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    print("Metadata:", data.metadata)
    global embedding_task, embedding_event

    if embedding_task is not None:
        return {"status": "error", "message": "An embedding process is already running"}

    embedding_event = asyncio.Event()

    async def event_generator():
        global embedding_task, embedding_event
        try:
            for result in embed(data):
                if embedding_event.is_set():
                    yield f"data: {{'type': 'cancelled', 'message': 'Embedding process cancelled'}}\n\n"
                    break

                if result["status"] == "progress":
                    progress_data = result["data"]
                    yield f"data: {{'type': 'progress', 'chunk': {progress_data['chunk']}, 'totalChunks': {progress_data['total_chunks']}, 'percent_complete': '{progress_data['percent_complete']}', 'est_remaining_time': '{progress_data['est_remaining_time']}'}}\n\n"
                else:
                    yield f"data: {{'type': '{result['status']}', 'message': '{result['message']}'}}\n\n"
                await asyncio.sleep(0.1)
        except Exception as e:
            yield f"data: {{'type': 'error', 'message': '{str(e)}'}}\n\n"
        finally:
            embedding_task = None
            embedding_event = None

    response = StreamingResponse(
        event_generator(), media_type="text/event-stream")
    embedding_task = asyncio.create_task(event_generator().__anext__())

    return response


@app.post("/youtube-ingest")
async def youtube_ingest(data: YoutubeTranscriptRequest, user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}

    async def event_generator():
        try:
            for result in youtube_transcript(data):
                if result["status"] == "progress":
                    progress_data = result["data"]
                    yield f"data: {{'type': 'progress', 'chunk': {progress_data['chunk']}, 'totalChunks': {progress_data['total_chunks']}, 'percent_complete': '{progress_data['percent_complete']}', 'message': '{progress_data['message']}'}}\n\n"
                else:
                    yield f"data: {{'type': '{result['status']}', 'message': '{result['message']}'}}\n\n"
                await asyncio.sleep(0.1)
        except Exception as e:
            yield f"data: {{'type': 'error', 'message': '{str(e)}'}}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/cancel-embed")
async def cancel_embedding(user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    global embedding_task, embedding_event
    if embedding_event:
        embedding_event.set()
        return {"status": "success", "message": "Embedding process cancelled"}
    return {"status": "error", "message": "No embedding process running"}


@app.post("/restart-server")
async def restart_server(user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}

    def restart():
        pid = os.getpid()
        parent = psutil.Process(pid)
        # Kill all child processes
        for child in parent.children(recursive=True):
            child.kill()
        # Kill the current process
        os.kill(pid, signal.SIGTERM)
        # Start a new instances
        python = sys.executable
        os.execl(python, python, *sys.argv)

    threading.Thread(target=restart).start()
    return {"status": "success", "message": "Server restart initiated"}


@app.post("/vector-query")
async def vector_query(data: VectorStoreQueryRequest, user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    try:
        result = query_vectorstore(data, data.is_local)
        return result
    except Exception as e:
        print(f"Error querying vectorstore: {str(e)}")
        return {"status": "error", "message": str(e)}


@app.post("/delete-collection")
async def delete_collection(data: DeleteCollectionRequest, user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    print("Authorized")
    return delete_vectorstore_collection(data)


@app.post("/api/vector")
async def api_vector(query_request: QueryRequest, user_id: str = Depends(api_key_auth)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    """ check to see if the userId has API key in SQLite """
    if not query_request.collection_name:
        print("No collection name provided")
        return {"status": "error", "message": "No collection name provided"}
    if check_api_key(int(user_id)) == False:
        print("Unauthorized")
        return {"status": "error", "message": "Unauthorized"}
    print("Authorized")
    return vector_call(query_request, user_id)


@app.post("/api/llm")
async def api_llm(query_request: ChatCompletionRequest, user_id: str = Depends(api_key_auth)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    """ check to see if the userId has API key in SQLite """
    if not query_request.model:
        print("No model provided")
        return {"status": "error", "message": "No model provided"}
    if check_api_key(int(user_id)) == False:
        print("Unauthorized")
        return {"status": "error", "message": "Unauthorized"}
    print("Authorized")
    return await llm_call(query_request, user_id)


@app.post("/api/rag")
async def api_rag(query_request: QueryRequest, user_id: str = Depends(api_key_auth)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    """ check to see if the userId has API key in SQLite """
    if not query_request.model:
        print("No model provided")
        return {"status": "error", "message": "No model provided"}
    if not query_request.collection_name:
        print("No collection name provided")
        return {"status": "error", "message": "No collection name provided"}
    if check_api_key(int(user_id)) == False:
        print("Unauthorized")
        return {"status": "error", "message": "Unauthorized"}
    print("Authorized")
    return await rag_call(query_request, user_id)


@app.post("/cancel-crawl")
async def cancel_crawl(user_id: str = Depends(verify_token)):
    if user_id is None:
        return {"status": "error", "message": "Unauthorized"}
    global crawl_task, crawl_event
    if crawl_event:
        crawl_event.set()
        return {"status": "success", "message": "Crawl process cancelled"}
    return {"status": "error", "message": "No crawl process running"}
# Add the chat completion endpoint


if __name__ == "__main__":
    print("Starting server...")
    uvicorn.run(app, host="127.0.0.1", port=47372)
