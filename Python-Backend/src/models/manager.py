import logging
from pathlib import Path
from typing import Optional, Tuple, Any, Dict, Union

from src.endpoint.models import ModelLoadRequest
from src.models.utils.device import get_device
from src.models.utils.platform import check_platform_compatibility
from src.models.utils.detect_type import detect_model_type
from src.models.exceptions import ModelLoadError, ModelNotFoundError
from src.models.loaders import (
    TransformersLoader,
    LlamaCppLoader,
    LlamaCppHFLoader,
    ExLlamaV2Loader,
    ExLlamaV2HFLoader,
    HQQLoader,
    TensorRTLoader
)

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Manages the loading, unloading, and switching of different AI models.
    Supports multiple model types and handles resource management.
    """

    def __init__(self):
        """Initialize the model manager with empty state."""
        self.current_model: Optional[Any] = None
        self.current_tokenizer: Optional[Any] = None
        self.model_type: Optional[str] = None
        self.device: Optional[str] = None
        self.model_name: Optional[str] = None
        self._is_loading: bool = False
        self.model_config: Optional[Dict[str, Any]] = None

        # Map model types to their respective loaders
        self.loader_mapping = {
            'Transformers': TransformersLoader,
            'llama.cpp': LlamaCppLoader,
            'llamacpp_HF': LlamaCppHFLoader,
            'ExLlamav2': ExLlamaV2Loader,
            'ExLlamav2_HF': ExLlamaV2HFLoader,
            'HQQ': HQQLoader,
            'TensorRT-LLM': TensorRTLoader
        }

    def check_platform_compatibility(self, model_type: str) -> Tuple[bool, str]:
        """Check if the current platform is compatible with the specified model type."""
        return check_platform_compatibility(model_type)

    def get_model_metadata(self, request: ModelLoadRequest) -> Optional[Dict[str, Any]]:
        """
        Get model metadata without loading the full model.
        
        Args:
            request: Model load request containing model information
            
        Returns:
            Dictionary containing model metadata or None if not found
        """
        try:
            model_path = Path(request.model_path) if request.model_path else Path(
                f"models/{request.model_name}")

            # Get the appropriate loader
            loader_class = self.loader_mapping.get(request.model_type)
            if loader_class:
                loader = loader_class(request, self)
                return loader.get_metadata()
            
            return None
        except Exception as e:
            logger.error(f"Error getting model metadata: {str(e)}")
            return None

    def is_model_loaded(self) -> bool:
        """Check if a model is currently loaded."""
        return self.current_model is not None

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the currently loaded model.
        
        Returns:
            Dictionary containing model information
        """
        info = {
            "model_name": self.model_name,
            "model_type": self.model_type,
            "device": self.device,
            "is_loaded": self.is_model_loaded(),
            "is_loading": self._is_loading,
        }
        if self.model_config:
            info["config"] = self._make_json_serializable(self.model_config)
        return self._make_json_serializable(info)

    def clear_model(self) -> None:
        """Unload the current model and clear CUDA cache."""
        try:
            if self.current_model is not None:
                # Let the specific loader handle cleanup if method exists
                loader_class = self.loader_mapping.get(self.model_type)
                if loader_class and hasattr(loader_class, 'cleanup'):
                    loader_class.cleanup(self.current_model)
                else:
                    # Default cleanup
                    if hasattr(self.current_model, 'cpu'):
                        self.current_model.cpu()
                    del self.current_model

            if self.current_tokenizer is not None:
                del self.current_tokenizer

            # Reset all attributes
            self.current_model = None
            self.current_tokenizer = None
            self.model_type = None
            self.device = None
            self.model_name = None
            self.model_config = None

            # Clear CUDA cache if available
            import torch
            import gc
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        except Exception as e:
            logger.error(f"Error clearing model: {str(e)}")
            raise

    def _make_json_serializable(self, obj: Any) -> Any:
        """Convert objects to JSON serializable format."""
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(v) for v in obj]
        elif hasattr(obj, 'dtype'):  # Handle torch dtypes
            return str(obj)
        return obj

    def load_model(self, request: ModelLoadRequest) -> Tuple[Any, Any]:
        """
        Load a model based on the request configuration.
        
        Args:
            request: Model load request containing all necessary parameters
            
        Returns:
            Tuple of (model, tokenizer)
            
        Raises:
            ModelLoadError: If there's an error during model loading
            ModelNotFoundError: If the requested model is not found
        """
        if self._is_loading:
            raise ModelLoadError("A model is already being loaded")

        try:
            self._is_loading = True
            self.clear_model()  # Clear any existing model

            # Set device using imported get_device function
            self.device = get_device(request)
            self.model_name = request.model_name

            # Handle Ollama models first - convert to llama.cpp
            if request.model_type == 'ollama':
                try:
                    # Read the manifest to get the blob SHA
                    manifest_path = Path(request.model_path) / 'latest'
                    logger.info(f"Looking for manifest at: {manifest_path}")
                    if not manifest_path.exists():
                        raise ModelLoadError(f"Manifest file not found at: {manifest_path}")

                    import json
                    with open(manifest_path) as f:
                        manifest = json.load(f)
                    logger.info(f"Manifest content: {json.dumps(manifest, indent=2)}")
                    
                    # Get the model layer (first layer with mediaType 'application/vnd.ollama.image.model')
                    try:
                        model_layer = next(layer for layer in manifest['layers'] 
                                        if layer['mediaType'] == 'application/vnd.ollama.image.model')
                    except StopIteration:
                        raise ModelLoadError("No model layer found in manifest")

                    # Extract SHA and construct blob path
                    sha = model_layer['digest'].split(':')[1]
                    # Ollama stores the files directly in the blobs directory with a sha256- prefix
                    blob_path = Path(request.model_path).parent.parent.parent.parent / 'blobs' / f'sha256-{sha}'
                    logger.info(f"Looking for blob at: {blob_path}")
                    
                    if not blob_path.exists():
                        raise ModelLoadError(f"Model file not found at: {blob_path}")

                    # Update the request to use the actual model file
                    request.model_path = str(blob_path)
                    request.model_type = "llama.cpp"
                    logger.info(f"Converting Ollama model to llama.cpp with path: {request.model_path}")

                except Exception as e:
                    logger.error(f"Error processing Ollama model: {str(e)}")
                    raise ModelLoadError(f"Failed to process Ollama model: {str(e)}")

            # Check if model exists locally first
            model_path = Path(request.model_path) if request.model_path else Path(f"models/{request.model_name}")
            if model_path.exists():
                logger.info(f"Found local model at: {model_path}")
                # Auto-detect model type if not specified
                if not request.model_type or request.model_type == "auto":
                    request.model_type = self._detect_model_type(request)
                    logger.info(f"Detected model type: {request.model_type}")
            else:
                # Only attempt to download if it looks like a HF model ID
                if '/' in request.model_name:
                    logger.info(f"Model not found locally, will attempt to download from HuggingFace")
                else:
                    raise ModelNotFoundError(f"Model not found at: {model_path}")

            # Check platform compatibility
            is_compatible, message = check_platform_compatibility(request.model_type)
            if not is_compatible:
                raise ModelLoadError(message)
            logger.info(message)

            # Get the appropriate loader
            loader_class = self.loader_mapping.get(request.model_type)
            logger.info(f"Model type: {request.model_type}")
            logger.info(f"Available loaders: {list(self.loader_mapping.keys())}")
            if not loader_class:
                raise ModelLoadError(f"Unsupported model type: {request.model_type}")

            # Initialize and use the loader
            loader = loader_class(request, self)
            model, tokenizer = loader.load()

            # Store the results
            self.current_model = model
            self.current_tokenizer = tokenizer
            self.model_type = request.model_type
            # Make config JSON serializable before storing
            self.model_config = self._make_json_serializable(loader.get_config())

            return model, tokenizer

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}", exc_info=True)
            self.clear_model()  # Cleanup on failure
            if isinstance(e, (ModelLoadError, ModelNotFoundError)):
                raise
            raise ModelLoadError(str(e))

        finally:
            self._is_loading = False

    def _detect_model_type(self, request: ModelLoadRequest) -> str:
        """
        Detect the type of model based on the model path and name.
        
        Args:
            request: Model load request
            
        Returns:
            String indicating the detected model type
        """
        model_path = Path(request.model_path) if request.model_path else Path(
            f"models/{request.model_name}")

        if model_path.exists():
            return detect_model_type(model_path)
        
        # Default to Transformers for HF models
        if '/' in request.model_name:
            return "Transformers"
        
        raise ModelNotFoundError(
            f"Could not detect model type: {request.model_name}")


# Global model manager instance
model_manager = ModelManager()