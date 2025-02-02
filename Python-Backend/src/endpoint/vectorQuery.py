from src.endpoint.models import VectorStoreQueryRequest
from src.vectorstorage.helpers.sanitizeCollectionName import sanitize_collection_name
from src.vectorstorage.vectorstore import get_vectorstore


def query_vectorstore(data: VectorStoreQueryRequest, is_local: bool):
    try:
        collection_name = sanitize_collection_name(str(data.collection_name))
        vectordb = get_vectorstore(
            data.api_key, collection_name, is_local, data.local_embedding_model)
        results = vectordb.similarity_search(data.query, k=data.top_k)
        return {
            "status": "success",
            "results": [{"content": doc.page_content, "metadata": doc.metadata} for doc in results],
        }
    except Exception as e:
        print(f"Error querying vectorstore: {str(e)}")
        return {"status": "error", "message": str(e)}
