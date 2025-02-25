from src.vectorstorage.init_store import get_models_dir
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings

import torch
import os
import platform
from src.config import config
import logging

logger = logging.getLogger(__name__)

def get_app_data_dir():
    home_dir = os.path.expanduser("~")
    if platform.system() == "Darwin":  # macOS
        app_data_dir = os.path.join(home_dir, "Library/Application Support/Notate")
    elif platform.system() == "Linux":  # Linux
        app_data_dir = os.path.join(home_dir, ".local/share/Notate")
    else:  # Windows and others
        app_data_dir = os.path.join(home_dir, ".notate")

    os.makedirs(app_data_dir, exist_ok=True)
    return app_data_dir

chroma_db_path = os.path.join(get_app_data_dir(), "chroma_db")
logger.info(f"Using Chroma DB path: {chroma_db_path}")


# Should this be renamed to "get_embedder" since this is not really getting the actual embeddings of the data
def get_embeddings(embeddings_provider: str = None, api_key: str = None):
    embeddings = None

    local_embedding_model: str = config['vectorstorage']['defaultLocalEmbeddingModel']

    if (embeddings_provider == None) or (embeddings_provider == 'local'):
        logger.info(f"Using local embedding model: {local_embedding_model}")
        
        # Determine the appropriate device
        device = "cpu"
        if torch.cuda.is_available():
            device = "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = "mps"    
        logger.info(f"Using device: {device}")

        models_dir = get_models_dir()
        logger.info(f"Using models directory: {models_dir}")

        model_kwargs = {"device": device}
        encode_kwargs = {
            "device": device,
            "normalize_embeddings": True,
            "max_seq_length": 512
        }

        try:
            embeddings = HuggingFaceEmbeddings(
                model_name=local_embedding_model,
                model_kwargs=model_kwargs,
                encode_kwargs=encode_kwargs,
                cache_folder=models_dir
            )
        except Exception as e:
            logger.error(f"Error initializing embeddings with {device}: {str(e)}")
            if device != "cpu":
                logger.info("Falling back to CPU")
                model_kwargs["device"] = "cpu"
                encode_kwargs["device"] = "cpu"
                embeddings = HuggingFaceEmbeddings(
                    model_name=local_embedding_model,
                    model_kwargs=model_kwargs,
                    encode_kwargs=encode_kwargs,
                    cache_folder=models_dir
                )
            else:
                raise
    
    elif embeddings_provider == "ollama":
        logger.info(f"Using Ollama model: {ollama_embedding_model}")
        embeddings = OllamaEmbeddings(
            model="snowflake-arctic-embed2" # TODO put in config.py
        )

    elif embeddings_provider == "OpenAI":
        logger.info("Using OpenAI embedding model")
        embeddings = OpenAIEmbeddings(api_key=api_key)

    return embeddings


def get_chromaDB_vectorstore(embedding_function, collection_name):
    try:
        from chromadb.config import Settings
        import chromadb

        # Use in-memory store if persistent store fails
        try:
            chroma_client = chromadb.PersistentClient(
                path=chroma_db_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                    is_persistent=True
                )
            )
        except Exception as e:
            logger.warning(f"Failed to create persistent client: {str(e)}, falling back to in-memory")
            chroma_client = chromadb.Client(
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                    is_persistent=False
                )
            )

        vectorstore = Chroma(
            client=chroma_client,
            embedding_function=embedding_function,
            collection_name=collection_name,
        )
        logger.info(f"Successfully initialized vectorstore for collection: {collection_name}")
        
        return vectorstore
    except Exception as e:
        logger.error(f"Error creating Chroma instance: {str(e)}")
        # Try one more time with in-memory store
        try:
            chroma_client = chromadb.Client(
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                    is_persistent=False
                )
            )
            vectorstore = Chroma(
                client=chroma_client,
                embedding_function=embedding_function,
                collection_name=collection_name,
            )
            return vectorstore
        except Exception as e2:
            logger.error(f"Error creating in-memory Chroma instance: {str(e2)}")
            return None

def get_PGVector_vectorstore(embedding_function, table):

    try:
        from langchain_postgres import PGVector
        from langchain_postgres.vectorstores import PGVector

        user = config['vectorstorage']['postgresUser']
        password = config['vectorstorage']['postgresPassword']
        host = config['vectorstorage']['postgresHost']
        port = config['vectorstorage']['postgresPort']
        db = config['vectorstorage']['postgresVectorDatabase']

        connection = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{db}"  # Uses psycopg3!

        vector_store = PGVector(
            embeddings=embedding_function,
            collection_name=table,
            connection=connection,
            use_jsonb=True,
        )

        return vector_store
    
    except Exception as e:
        logger.error(e)
        logger.error("libpq5 and libpq5-dev are not installed, PostgreSQL will not be supported")
        return None

def get_vectorstore(
        api_key: str, 
        collection_name: str, 
        use_local_embeddings: bool = False, 
        local_embedding_model: str = "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5", # unused, moved to config.py
        which_vectorstore: str = 'ChromaDB',
        embeddings_provider: str = 'OpenAI'):

    try:
        # Get embeddings
        embeddings = None

        # TODO improve the logic
        if (use_local_embeddings or api_key is None) and embeddings_provider != 'ollama':
            embeddings = get_embeddings()
        else:
            embeddings = get_embeddings(embeddings_provider=embeddings_provider, api_key=api_key)

        # Try to create vectorstore with specific settings
        vectorstore = None

        if which_vectorstore == 'ChromaDB':
            vectorstore = get_chromaDB_vectorstore(embedding_function=embeddings, collection_name=collection_name)
        elif which_vectorstore == 'PGVector':
            vectorstore = get_PGVector_vectorstore(embedding_function=embeddings, table=collection_name)
        else:
            raise Exception("Unsupported parameter for 'which_vectorstore', valid parameters are, 'ChromaDB' and 'PGVector'")

        return vectorstore


    except Exception as e:
        logger.error(f"Error getting vectorstore: {str(e)}")
        return None
