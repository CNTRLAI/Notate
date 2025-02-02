import asyncio
import json
import time
import logging
from src.endpoint.api import chat_completion_stream
from src.endpoint.models import ChatCompletionRequest, ModelLoadRequest
from src.models.manager import model_manager
from src.models.exceptions import ModelLoadError

logger = logging.getLogger(__name__)


async def local_query(data: ChatCompletionRequest):
    try:
        # Check if model is loaded and load it if necessary
        if not model_manager.is_model_loaded() or model_manager.model_name != data.model:
            logger.info(f"Loading model {data.model} as it is not currently loaded")
            # Create model load request
            load_request = ModelLoadRequest(
                model_name=data.model,
                model_type="Transformers",  # Default to Transformers for now
                device="auto",
                trust_remote_code=True,
                use_safetensors=True,
                compute_dtype="float16"
            )
            try:
                # Load the model
                model_manager.load_model(load_request)
                logger.info(f"Successfully loaded model {data.model}")
            except ModelLoadError as e:
                logger.error(f"Failed to load model {data.model}: {str(e)}")
                raise

        # Get the generator
        response_gen = chat_completion_stream(data)
        combined_content = ""
        response_id = None
        finish_reason = None

        # Process each chunk
        async for chunk in response_gen:
            if chunk.startswith("data: "):
                chunk = chunk[6:]  # Remove "data: " prefix
                if chunk.strip() == "[DONE]":
                    continue

                try:
                    chunk_data = json.loads(chunk)
                    if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                        choice = chunk_data["choices"][0]
                        if "delta" in choice:
                            delta = choice["delta"]
                            if "content" in delta:
                                combined_content += delta["content"]
                            if "finish_reason" in choice and choice["finish_reason"]:
                                finish_reason = choice["finish_reason"]
                        if not response_id:
                            response_id = chunk_data.get("id")
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse chunk as JSON: {str(e)}")
                    continue

        # Create final response structure
        response = {
            "id": response_id or f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": data.model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": combined_content
                },
                "finish_reason": finish_reason or "stop"
            }]
        }

        return response

    except Exception as e:
        logger.error(f"Error in local_query: {str(e)}", exc_info=True)
        raise
