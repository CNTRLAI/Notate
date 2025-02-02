import os
import logging
import requests
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from tqdm import tqdm
import sys

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
        """Load a llama.cpp model and return the model and tokenizer."""
        try:
            import torch
            from llama_cpp import Llama

            # Force CUDA environment variables before anything else
            if torch.cuda.is_available():
                os.environ['CUDA_VISIBLE_DEVICES'] = '0'
                os.environ['LLAMA_CUDA_FORCE'] = '1'

                # Log CUDA information
                logger.info("CUDA is available")
                logger.info(f"CUDA Device: {torch.cuda.get_device_name(0)}")
                logger.info(
                    f"Total CUDA Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**2:.0f}MB")
                torch.cuda.empty_cache()

            # Get model path and ensure it exists
            model_path = self._get_model_path()
            if not model_path.exists():
                raise ModelLoadError(f"Model file not found: {model_path}")

            logger.info(f"Loading model from path: {model_path}")

            # Simple CUDA parameters that match working Q8 configurations
            model_params = {
                "model_path": str(model_path),
                "n_ctx": int(self.request.n_ctx) if self.request.n_ctx is not None else 2048,
                "n_batch": int(self.request.n_batch) if self.request.n_batch is not None else 512,
                "n_gpu_layers": -1,
                "main_gpu": 0,
                "use_mmap": True,  # Enable memory mapping
                "use_mlock": False,
                "verbose": True
            }

            # Log parameters
            logger.info(f"Loading model with parameters: {model_params}")

            # Load model
            model = Llama(**model_params)
            logger.info("Initial model load successful")

            # Simple CUDA test
            if torch.cuda.is_available():
                try:
                    logger.info("Testing model...")
                    # Basic tokenization test
                    tokens = model.tokenize(b"test")
                    logger.info("Tokenization successful")

                    # Log memory usage
                    allocated = torch.cuda.memory_allocated() / 1024**2
                    reserved = torch.cuda.memory_reserved() / 1024**2
                    logger.info(f"CUDA Memory allocated: {allocated:.2f}MB")
                    logger.info(f"CUDA Memory reserved: {reserved:.2f}MB")

                except Exception as e:
                    logger.error(f"Model test failed: {e}")
                    raise ModelLoadError(f"Failed to initialize model: {e}")

            logger.info("Model loaded successfully")
            return model, model

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}", exc_info=True)
            raise ModelLoadError(f"Failed to load llama.cpp model: {str(e)}")

    def _get_model_path(self) -> Path:
        """Get and validate the model path, downloading if necessary."""
        # Handle both direct file paths and model names
        if self.request.model_path:
            model_path = Path(self.request.model_path)
        else:
            # Convert HF style paths to filesystem paths
            safe_name = self.request.model_name.replace('/', os.path.sep)
            model_path = Path('models') / safe_name

        model_dir = model_path if model_path.is_dir() else model_path.parent
        model_dir.mkdir(parents=True, exist_ok=True)

        # Special handling for Ollama paths
        if '.ollama' in str(model_path):
            logger.info("Detected Ollama model path")

            # Determine Ollama directory based on OS
            if sys.platform == 'darwin':  # macOS specific path
                ollama_dir = Path(os.path.expanduser('~/.ollama'))
                logger.info(f"Using macOS Ollama directory: {ollama_dir}")
            else:  # Windows and Linux
                ollama_dir = Path(os.path.expandvars('%USERPROFILE%\\.ollama'))
                if not ollama_dir.exists():
                    ollama_dir = Path(os.path.expanduser('~/.ollama'))

            if not ollama_dir.exists():
                raise ModelLoadError(
                    f"Ollama directory not found at: {ollama_dir}")

            # Extract model name from path
            model_name = self.request.model_name
            if not model_name and 'registry.ollama.ai/library/' in str(model_path):
                model_name = str(model_path).split(
                    'registry.ollama.ai/library/')[-1].split('/')[0]
            logger.info(f"Using model name: {model_name}")

            # First check for the model file in the models directory
            models_dir = ollama_dir / 'models'
            logger.info(f"Checking Ollama models directory: {models_dir}")

            if models_dir.exists():
                # First try to find a .gguf file
                gguf_files = list(models_dir.glob("**/*.gguf"))
                if gguf_files:
                    logger.info(f"Found Ollama GGUF file: {gguf_files[0]}")
                    return gguf_files[0]

                # Look for manifest
                manifest_dir = models_dir / 'manifests' / \
                    'registry.ollama.ai' / 'library' / model_name
                manifest_path = manifest_dir / 'latest'
                logger.info(f"Looking for manifest at: {manifest_path}")

                if manifest_path.exists():
                    with open(manifest_path, 'r') as f:
                        manifest = f.read()
                        logger.info(f"Manifest content: {manifest}")
                        import json
                        try:
                            manifest_data = json.loads(manifest)
                            for layer in manifest_data.get('layers', []):
                                if layer.get('mediaType') == 'application/vnd.ollama.image.model':
                                    blob_hash = layer.get('digest', '').replace(
                                        'sha256:', 'sha256-')
                                    if blob_hash:
                                        # Check both blobs and models directories for the file
                                        possible_paths = [
                                            models_dir / 'blobs' / blob_hash,
                                            ollama_dir / 'blobs' / blob_hash
                                        ]

                                        for blob_path in possible_paths:
                                            logger.info(
                                                f"Checking for blob at: {blob_path}")
                                            if blob_path.exists():
                                                logger.info(
                                                    f"Found Ollama model blob: {blob_path}")
                                                return blob_path

                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse manifest: {e}")
                            pass

            logger.warning(f"No Ollama model files found in: {models_dir}")
            raise ModelLoadError(
                f"Could not find Ollama model files in {models_dir}")

        # Check for existing GGUF files in the directory
        if model_dir.exists():
            existing_gguf = list(model_dir.glob("*.gguf"))
            if existing_gguf:
                logger.info(f"Found existing GGUF model: {existing_gguf[0]}")
                return existing_gguf[0]

        # Only attempt to download if it looks like a HF model ID
        if '/' in self.request.model_name:
            return self._download_model(model_dir)

        raise ModelLoadError(f"No model files found in: {model_dir}")

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
            gguf_files = [f for f in files if f.get(
                'path', '').endswith('.gguf')]
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

        # Base parameters
        params = {
            "n_ctx": int(self.request.n_ctx) if self.request.n_ctx is not None else 2048,
            "n_batch": int(self.request.n_batch) if self.request.n_batch is not None else 512,
            "n_threads": int(self.request.n_threads) if self.request.n_threads is not None else os.cpu_count(),
            "verbose": True,  # Enable verbose output for debugging
        }

        # Add CUDA parameters if available
        if torch.cuda.is_available():
            logger.info("Configuring CUDA parameters...")

            # Force CUDA environment variables
            os.environ['CUDA_VISIBLE_DEVICES'] = '0'
            os.environ['LLAMA_CUDA_FORCE'] = '1'
            os.environ['LLAMA_FORCE_GPU'] = '1'  # Force GPU usage
            os.environ['LLAMA_CPU_DISABLE'] = '1'  # Disable CPU fallback

            # Enhanced CUDA parameters - optimized for GPU usage
            cuda_params = {
                "n_gpu_layers": -1,    # Use all layers on GPU
                "main_gpu": 0,         # Use the first GPU
                "tensor_split": None,   # No tensor splitting
                "use_mmap": False,     # Disable memory mapping
                "use_mlock": True,     # Lock memory to prevent swapping
                "mul_mat_q": True,     # Enable matrix multiplication
                "offload_kqv": True,   # Keep KQV on GPU
                "f16_kv": True,        # Use float16 for KV cache
                "logits_all": True,    # Compute logits for all tokens
                "embedding": True      # Use GPU for embeddings
            }

            params.update(cuda_params)
            logger.info(f"CUDA parameters configured: {cuda_params}")

            # Log CUDA device info
            logger.info(f"CUDA Device: {torch.cuda.get_device_name(0)}")
            logger.info(
                f"CUDA Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**2:.0f}MB")

        # Add optional parameters if specified in request
        optional_params = {
            "tensor_split": self.request.tensor_split,
            "split_mode": self.request.split_mode,
            "cache_type": self.request.cache_type,
        }

        # Only add optional params if they have non-None values
        params.update(
            {k: v for k, v in optional_params.items() if v is not None})

        logger.info(f"Final model parameters: {params}")
        return params

    def _configure_gpu_layers(self) -> int:
        """Configure the number of GPU layers based on hardware and request."""
        import torch

        if not torch.cuda.is_available():
            return 0

        # Force environment variables for CUDA
        os.environ['CUDA_VISIBLE_DEVICES'] = '0'
        os.environ['LLAMA_CUDA_FORCE'] = '1'

        # If n_gpu_layers is specified in request, use that
        if self.request.n_gpu_layers is not None:
            return self.request.n_gpu_layers

        # Otherwise, use all layers on GPU
        return -1  # -1 means use all layers on GPU

    def _setup_cache(self, model: Any) -> None:
        """Setup model cache if supported."""
        try:
            from llama_cpp import LlamaCache
            if hasattr(model, 'set_cache'):
                # Convert GB to bytes
                cache_size = self.request.cache_size * 1024 * 1024 * 1024
                cache_type = "fp16"  # or q8_0 or q4_0 depending on your needs
                model.set_cache(LlamaCache(capacity_bytes=cache_size))
                logger.info(
                    f"Initialized LLM cache with {self.request.cache_size}GB capacity using {cache_type}")
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
                model = Llama(model_path=str(model_path),
                              n_ctx=8, n_gpu_layers=0)
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
