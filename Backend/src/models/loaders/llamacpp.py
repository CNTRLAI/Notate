import os
import logging
import requests
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
from tqdm import tqdm

from src.models.loaders.base import BaseLoader
from src.endpoint.models import ModelLoadRequest
from src.models.exceptions import ModelDownloadError, ModelLoadError

logger = logging.getLogger(__name__)

class LlamaCppLoader(BaseLoader):
    """
    Loader for llama.cpp models. Handles both local and remote model loading,
    with support for GGUF format and various optimizations.
    """

    def __init__(self, request: ModelLoadRequest, manager: Any):
        super().__init__(request, manager)
        self.llama = None
        self.cache = None

    def load(self) -> Tuple[Any, Any]:
        """
        Load a llama.cpp model and return the model and tokenizer.
        
        Returns:
            Tuple[model, tokenizer] where both are the same object for llama.cpp
            
        Raises:
            ModelLoadError: If there's an error loading the model
            ModelDownloadError: If there's an error downloading the model
        """
        try:
            from llama_cpp import Llama, LlamaCache
        except ImportError:
            raise ModelLoadError(
                "llama-cpp-python is not installed. Please install it with: pip install llama-cpp-python")

        try:
            # Get model path and ensure it exists
            model_path = self._get_model_path()
            
            # Configure model parameters
            model_params = self._get_model_params()
            
            # Load the model
            logger.info(f"Loading llama.cpp model from {model_path}")
            model = Llama(**model_params)
            
            # Configure cache if requested
            if self.request.cache_size:
                self._setup_cache(model)

            logger.info("Model loaded successfully")
            return model, model  # llama.cpp includes its own tokenizer

        except Exception as e:
            raise ModelLoadError(f"Failed to load llama.cpp model: {str(e)}")

    def _get_model_path(self) -> Path:
        """Get and validate the model path, downloading if necessary."""
        model_path = Path(self.request.model_path) if self.request.model_path else Path(
            f"models/{self.request.model_name}")
        model_dir = model_path.parent
        model_dir.mkdir(parents=True, exist_ok=True)

        # Check for existing GGUF files
        existing_gguf = list(model_dir.glob("*.gguf"))
        if existing_gguf:
            logger.info(f"Found existing GGUF model: {existing_gguf[0]}")
            return existing_gguf[0]

        # Download if it's a HF model ID
        if '/' in self.request.model_name:
            return self._download_model(model_dir)

        if not model_path.exists():
            raise ModelLoadError(
                f"Model path does not exist: {model_path}")

        return model_path

    def _download_model(self, model_dir: Path) -> Path:
        """Download model from Hugging Face."""
        logger.info(f"Attempting to download model: {self.request.model_name}")

        try:
            # Setup API request
            api_url = f"https://huggingface.co/api/models/{self.request.model_name}/tree/main"
            headers = {"Accept": "application/json"}
            if self.request.hf_token:
                headers["Authorization"] = f"Bearer {self.request.hf_token}"

            # Get repository contents
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            files = response.json()

            # Find GGUF files
            gguf_files = [f for f in files if f.get('path', '').endswith('.gguf')]
            if not gguf_files:
                raise ModelDownloadError(
                    f"No GGUF files found in repository {self.request.model_name}")

            # Sort by preference (q4_k_m) and size
            gguf_files.sort(key=lambda x: (
                0 if 'q4_k_m' in x['path'].lower() else 1,
                x.get('size', float('inf'))
            ))

            # Download the best candidate
            file_info = gguf_files[0]
            file_name = file_info['path']
            download_url = f"https://huggingface.co/{self.request.model_name}/resolve/main/{file_name}"
            model_path = model_dir / file_name

            if not model_path.exists() or model_path.stat().st_size == 0:
                self._download_file(download_url, model_path, headers)

            return model_path

        except Exception as e:
            raise ModelDownloadError(f"Failed to download model: {str(e)}")

    def _download_file(self, url: str, path: Path, headers: Dict[str, str]) -> None:
        """Download a file with progress bar."""
        response = requests.get(url, stream=True, headers=headers)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        block_size = 8192

        with open(path, 'wb') as f, tqdm(
            desc=path.name,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as pbar:
            for data in response.iter_content(block_size):
                size = f.write(data)
                pbar.update(size)

    def _get_model_params(self) -> Dict[str, Any]:
        """Configure model parameters based on request and system capabilities."""
        import torch

        # Configure GPU layers
        gpu_layers = self._configure_gpu_layers()

        # Base parameters
        params = {
            "model_path": str(self._get_model_path()),
            "n_ctx": int(self.request.n_ctx) if self.request.n_ctx is not None else 2048,
            "n_batch": int(self.request.n_batch) if self.request.n_batch is not None else 512,
            "n_threads": int(self.request.n_threads) if self.request.n_threads is not None else os.cpu_count(),
            "n_threads_batch": int(self.request.n_threads_batch) if self.request.n_threads_batch is not None else min(8, os.cpu_count()),
            "n_gpu_layers": int(gpu_layers),
            "main_gpu": int(self.request.main_gpu) if self.request.main_gpu is not None else 0,
        }

        # Add optional parameters
        optional_params = {
            "tensor_split": self.request.tensor_split,
            "mul_mat_q": self.request.mul_mat_q,
            "use_mmap": self.request.use_mmap,
            "use_mlock": self.request.use_mlock,
            "offload_kqv": self.request.offload_kqv,
            "split_mode": self.request.split_mode,
            "flash_attn": self.request.flash_attn,
            "cache_type": self.request.cache_type,
        }

        params.update({k: v for k, v in optional_params.items() if v is not None})

        # Add rope parameters if specified
        if self.request.rope_scaling_type:
            params["rope_scaling_type"] = self.request.rope_scaling_type
            if self.request.rope_freq_base is not None:
                params["rope_freq_base"] = self.request.rope_freq_base
            if self.request.rope_freq_scale is not None:
                params["rope_freq_scale"] = self.request.rope_freq_scale

        return params

    def _configure_gpu_layers(self) -> int:
        """Configure the number of GPU layers based on device and request."""
        import torch

        gpu_layers = self.request.n_gpu_layers or 0

        if self.request.device == "mps" or (
            self.request.device == "auto" and 
            hasattr(torch.backends, "mps") and 
            torch.backends.mps.is_available()
        ):
            # For M1/M2 Macs
            gpu_layers = self.request.n_gpu_layers if self.request.n_gpu_layers is not None else 1
            logger.info("Using Metal acceleration for M1/M2 Mac")
        elif self.request.device == "cuda" or (
            self.request.device == "auto" and 
            torch.cuda.is_available()
        ):
            # For CUDA
            gpu_layers = self.request.n_gpu_layers if self.request.n_gpu_layers is not None else 0
            logger.info(f"Using CUDA acceleration with {gpu_layers} GPU layers")

        return gpu_layers

    def _setup_cache(self, model: Any) -> None:
        """Setup model cache if supported."""
        try:
            from llama_cpp import LlamaCache
            if hasattr(model, 'set_cache'):
                model.set_cache(LlamaCache(capacity_bytes=self.request.cache_size))
                logger.info(
                    f"Initialized LLM cache with {self.request.cache_size / (1024*1024*1024):.1f}GB capacity")
        except Exception as e:
            logger.warning(f"Failed to initialize cache: {e}")

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get model metadata without loading the full model."""
        try:
            model_path = self._get_model_path()
            if not model_path.exists():
                return None

            # Basic metadata
            metadata = {
                "model_type": "llama.cpp",
                "model_path": str(model_path),
                "file_size": model_path.stat().st_size,
                "format": "GGUF" if model_path.suffix == '.gguf' else "Unknown"
            }

            # Try to get additional metadata from the GGUF file
            try:
                from llama_cpp import Llama
                model = Llama(model_path=str(model_path), n_ctx=8, n_gpu_layers=0)
                metadata.update({
                    "n_vocab": model.n_vocab(),
                    "n_ctx_train": model.n_ctx_train(),
                    "n_embd": model.n_embd(),
                    "desc": model.desc(),
                })
            except:
                pass

            return metadata
        except Exception as e:
            logger.error(f"Error getting model metadata: {str(e)}")
            return None

    def get_config(self) -> Dict[str, Any]:
        """Get the current model configuration."""
        return {
            "model_type": "llama.cpp",
            "n_ctx": self.request.n_ctx,
            "n_batch": self.request.n_batch,
            "n_gpu_layers": self.request.n_gpu_layers,
            "device": self.request.device,
        }

    @staticmethod
    def cleanup(model: Any) -> None:
        """Clean up model resources."""
        try:
            del model
        except:
            pass