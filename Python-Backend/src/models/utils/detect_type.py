import json
from pathlib import Path
from typing import Union
import logging

logger = logging.getLogger(__name__)


def detect_model_type(model_path: Union[str, Path]) -> str:
    """
    Detect the model type from the model files and metadata
    Returns one of: 'ollama', 'Transformers', 'llama.cpp', 'llamacpp_HF', 'ExLlamav2', 'ExLlamav2_HF', 'HQQ', 'TensorRT-LLM'
    """
    model_path = Path(model_path)
    if not model_path.exists():
        raise ValueError(f"Model path does not exist: {model_path}")

    # Check for model metadata
    metadata_path = model_path / "metadata.json"
    if metadata_path.exists():
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                if "model_type" in metadata:
                    return metadata["model_type"]
        except:
            logger.warning(f"Could not read metadata from {metadata_path}")

    # Check for specific file patterns
    files = list(model_path.glob("*"))
    file_names = [f.name for f in files]

    # TensorRT-LLM check
    if any(f.endswith('.engine') for f in file_names) or any(f.endswith('.plan') for f in file_names):
        return 'TensorRT-LLM'

    # llama.cpp check
    if any(f.endswith('.gguf') for f in file_names):
        # Check if there's a HF tokenizer
        if any(f == 'tokenizer_config.json' for f in file_names):
            return 'ExLlamav2_HF'
        return 'ExLlamav2'

    # HQQ check
    if any(f.endswith('.hqq') for f in file_names):
        return 'HQQ'

    # Default to Transformers for standard HF models
    if any(f in file_names for f in ['config.json', 'pytorch_model.bin', 'model.safetensors']):
        # Only check for ExLlamav2 if we find specific ExLlamav2 files
        if (model_path / 'tokenizer.model').exists():
            config_path = model_path / 'config.json'
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    if config.get('model_type', '').lower() in ['llama', 'mistral']:
                        return 'ExLlamav2'
            except:
                pass
        return 'Transformers'

    raise ValueError(
        f"Could not determine model type from files in {model_path}")
