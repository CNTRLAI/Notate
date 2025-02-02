from src.endpoint.models import DeleteCollectionRequest
from src.vectorstorage.vectorstore import get_vectorstore
import logging

logger = logging.getLogger(__name__)


def delete_vectorstore_collection(data: DeleteCollectionRequest):
    try:
        logger.info(f"Deleting vectorstore collection: {data.collection_name}")
        vectorstore = get_vectorstore(
            data.api_key, data.collection_name, data.is_local)
        if vectorstore:
            vectorstore.delete_collection()
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting vectorstore collection: {str(e)}")
        return False
