from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import logging
from dataclasses import asdict

from src.endpoint.models import ModelLoadRequest
from src.models.exceptions import ModelLoadError

logger = logging.getLogger(__name__)


class BaseLoader(ABC):
    """
    Abstract base class for model loaders.

    This class defines the interface that all model loaders must implement
    and provides some common utility methods.

    Attributes:
        request (ModelLoadRequest): The request object containing loading parameters
        manager (Any): Reference to the model manager instance
        model_path (Path): Path to the model files
    """

    def __init__(self, request: ModelLoadRequest, manager: Any):
        """
        Initialize the loader with request parameters and manager reference.

        Args:
            request: ModelLoadRequest object containing all loading parameters
            manager: Reference to the ModelManager instance
        """
        self.request = request
        self.manager = manager
        self.model_path = self._resolve_model_path()

    @abstractmethod
    def load(self) -> Tuple[Any, Any]:
        """
        Load the model and tokenizer.

        Returns:
            Tuple containing (model, tokenizer)

        Raises:
            ModelLoadError: If there's an error during model loading
        """
        pass

    @abstractmethod
    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """
        Get model metadata without loading the full model.

        Returns:
            Dictionary containing model metadata or None if not available
        """
        pass

    @abstractmethod
    def get_config(self) -> Dict[str, Any]:
        """
        Get the current model configuration.

        Returns:
            Dictionary containing model configuration
        """
        pass

    def _resolve_model_path(self) -> Path:
        """
        Resolve the model path from the request parameters.

        Returns:
            Path object pointing to the model location

        Raises:
            ModelLoadError: If the path cannot be resolved
        """
        try:
            if self.request.model_path:
                path = Path(self.request.model_path)
            else:
                path = Path(f"models/{self.request.model_name}")

            # Create parent directories if they don't exist
            path.parent.mkdir(parents=True, exist_ok=True)

            return path
        except Exception as e:
            raise ModelLoadError(f"Failed to resolve model path: {str(e)}")

    def get_request_dict(self) -> Dict[str, Any]:
        """
        Convert the request object to a dictionary, filtering out None values.

        Returns:
            Dictionary containing all non-None request parameters
        """
        return {k: v for k, v in asdict(self.request).items() if v is not None}

    def log_loading_info(self) -> None:
        """Log information about the model being loaded."""
        logger.info(f"Loading model: {self.request.model_name}")
        logger.info(f"Model type: {self.request.model_type}")
        logger.info(f"Model path: {self.model_path}")
        logger.info(f"Device: {self.request.device}")

    @staticmethod
    def cleanup(model: Any) -> None:
        """
        Clean up model resources.

        Args:
            model: The model instance to clean up
        """
        try:
            if hasattr(model, 'cpu'):
                model.cpu()
            del model
        except Exception as e:
            logger.warning(f"Error during model cleanup: {str(e)}")

    def validate_model_path(self) -> None:
        """
        Validate that the model path exists and is accessible.

        Raises:
            ModelLoadError: If the model path is invalid or inaccessible
        """
        if not self.model_path.exists():
            raise ModelLoadError(
                f"Model path does not exist: {self.model_path}")

    def get_common_metadata(self) -> Dict[str, Any]:
        """
        Get common metadata that applies to all model types.

        Returns:
            Dictionary containing common metadata fields
        """
        return {
            "model_name": self.request.model_name,
            "model_type": self.request.model_type,
            "model_path": str(self.model_path),
            "device": self.request.device,
            "file_size": self.model_path.stat().st_size if self.model_path.exists() else None,
        }

    def validate_request(self) -> None:
        """
        Validate the model load request parameters.

        Raises:
            ModelLoadError: If the request parameters are invalid
        """
        if not self.request.model_name:
            raise ModelLoadError("Model name is required")

        if not self.request.model_type:
            raise ModelLoadError("Model type is required")

    def check_dependencies(self) -> None:
        """
        Check if all required dependencies are installed.

        Raises:
            ModelLoadError: If any required dependency is missing
        """
        pass  # Implement in specific loaders

    def prepare_loading(self) -> None:
        """
        Prepare for model loading by performing all necessary checks.

        This method combines several validation steps and should be
        called at the start of the load method in implementing classes.

        Raises:
            ModelLoadError: If any preparation step fails
        """
        try:
            self.validate_request()
            self.check_dependencies()
            self.validate_model_path()
            self.log_loading_info()
        except Exception as e:
            raise ModelLoadError(
                f"Failed to prepare for model loading: {str(e)}")

    def get_device_config(self) -> Dict[str, Any]:
        """
        Get device-specific configuration.

        Returns:
            Dictionary containing device configuration
        """
        import torch

        return {
            "device": self.request.device,
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "mps_available": hasattr(torch.backends, "mps") and torch.backends.mps.is_available(),
        }

    def get_memory_info(self) -> Dict[str, Any]:
        """
        Get system memory information.

        Returns:
            Dictionary containing memory information
        """
        try:
            import psutil
            vm = psutil.virtual_memory()
            return {
                "total_memory": vm.total,
                "available_memory": vm.available,
                "memory_percent": vm.percent,
            }
        except ImportError:
            return {}

    def get_system_info(self) -> Dict[str, Any]:
        """
        Get system information.

        Returns:
            Dictionary containing system information
        """
        import platform

        return {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "python_version": platform.python_version(),
            "device_config": self.get_device_config(),
            "memory_info": self.get_memory_info(),
        }

    def log_error(self, error: Exception, context: str = "") -> None:
        """
        Log an error with context.

        Args:
            error: The exception that occurred
            context: Additional context about where/why the error occurred
        """
        error_msg = f"{context + ': ' if context else ''}{str(error)}"
        logger.error(error_msg, exc_info=True)

    def __repr__(self) -> str:
        """
        Get string representation of the loader.

        Returns:
            String representation including model name and type
        """
        return f"{self.__class__.__name__}(model_name={self.request.model_name}, model_type={self.request.model_type})"
