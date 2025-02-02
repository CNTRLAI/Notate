from langchain_huggingface import HuggingFaceEmbeddings
import logging
import torch
import os
from pathlib import Path

logger = logging.getLogger(__name__)

def get_models_dir():
    if os.name == 'posix':
        # For Linux, use ~/.local/share/Notate/models
        if os.uname().sysname == 'Linux':
            base_dir = os.path.expanduser('~/.local/share/Notate')
        # For macOS, use ~/Library/Application Support/Notate/models
        else:
            base_dir = os.path.expanduser('~/Library/Application Support/Notate')
    else:
        # For Windows, use %APPDATA%/Notate
        base_dir = os.path.expanduser('~/.notate')
    
    models_dir = os.path.join(base_dir, 'embeddings_models')
    os.makedirs(models_dir, exist_ok=True)
    return models_dir

async def init_store(model_name: str = "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5"):
    logger.info("Initializing HuggingFace embeddings")

    # Determine the appropriate device
    if torch.cuda.is_available():
        device = "cuda"
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"
        
    logger.info(f"Using device: {device}")
    models_dir = get_models_dir()
    logger.info(f"Using models directory: {models_dir}")

    model_kwargs = {
        "device": device
    }

    encode_kwargs = {
        "device": device,
        "normalize_embeddings": True,
        "max_seq_length": 512
    }

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs,
            cache_folder=models_dir
        )
        return embeddings
    except Exception as e:
        logger.error(f"Error initializing embeddings: {str(e)}")
        # Fallback to CPU if there's an error with the device
        if device != "cpu":
            logger.info("Falling back to CPU")
            model_kwargs["device"] = "cpu"
            encode_kwargs["device"] = "cpu"
            return HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs=model_kwargs,
                encode_kwargs=encode_kwargs,
                cache_folder=models_dir
            )
        raise
