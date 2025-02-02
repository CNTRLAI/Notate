import logging
from typing import Any, Dict, Optional, Tuple
import requests
from tqdm import tqdm

from src.models.loaders.base import BaseLoader
from src.models.exceptions import ModelLoadError, ModelDownloadError
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)


class HQQLoader(BaseLoader):
    """Loader for HQQ quantized models."""

    def load(self) -> Tuple[Any, Any]:
        """Load an HQQ model."""
        try:
            from hqq.core.quantize import HQQBackend, HQQLinear
            from hqq.models.hf.base import AutoHQQHFModel
        except ImportError:
            raise ModelLoadError(
                "hqq is not installed. Please install it from the HQQ repository")

        try:
            # Create models directory if it doesn't exist
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info(f"Using model path: {self.model_path}")

            # If it's a HuggingFace model ID and doesn't exist locally, try to download it
            if '/' in self.request.model_name and not self.model_path.exists():
                self._download_model()

            if not self.model_path.exists():
                raise ModelLoadError(
                    f"Model path does not exist: {self.model_path}")

            logger.info(f"Loading HQQ model from {self.model_path}")
            model = AutoHQQHFModel.from_quantized(str(self.model_path))
            logger.info("Model loaded successfully")

            logger.info(f"Setting HQQ backend to {self.request.hqq_backend}")
            HQQLinear.set_backend(
                getattr(HQQBackend, self.request.hqq_backend))
            logger.info("HQQ backend set successfully")

            logger.info("Loading tokenizer")
            tokenizer = AutoTokenizer.from_pretrained(
                self.request.tokenizer_path or self.model_path,
                trust_remote_code=self.request.trust_remote_code,
                use_fast=self.request.use_fast_tokenizer,
            )
            logger.info("Tokenizer loaded successfully")

            return model, tokenizer

        except Exception as e:
            raise ModelLoadError(f"Failed to load HQQ model: {str(e)}")

    def _download_model(self) -> None:
        """Download model from HuggingFace."""
        try:
            # Get repository contents
            api_url = f"https://huggingface.co/api/models/{self.request.model_name}/tree/main"
            headers = {"Accept": "application/json"}
            if self.request.hf_token:
                headers["Authorization"] = f"Bearer {self.request.hf_token}"

            logger.info(f"Fetching repository contents from {api_url}")
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            files = response.json()
            logger.info(f"Found {len(files)} files in repository")

            # Required files for HQQ models
            required_files = ['qmodel.pt', 'config.json',
                              'tokenizer.model', 'tokenizer_config.json', 'tokenizer.json']
            logger.info(f"Required files: {required_files}")

            # Download each required file
            for file_name in required_files:
                file_info = next(
                    (f for f in files if f['path'] == file_name), None)
                if not file_info:
                    logger.error(
                        f"Required file {file_name} not found in repository. Available files: {[f['path'] for f in files]}")
                    raise ModelDownloadError(
                        f"Required file {file_name} not found in repository {self.request.model_name}")

                download_url = f"https://huggingface.co/{self.request.model_name}/resolve/main/{file_name}"
                file_path = self.model_path / file_name

                # Download the file with progress bar
                logger.info(
                    f"Downloading {file_name} ({file_info.get('size', 'unknown size')}) from {download_url}")
                response = requests.get(
                    download_url, stream=True, headers=headers)
                response.raise_for_status()

                total_size = int(response.headers.get('content-length', 0))
                block_size = 8192  # 8 KB

                with open(file_path, 'wb') as f, tqdm(
                    desc=file_name,
                    total=total_size,
                    unit='iB',
                    unit_scale=True,
                    unit_divisor=1024,
                ) as pbar:
                    for data in response.iter_content(block_size):
                        size = f.write(data)
                        pbar.update(size)

                logger.info(
                    f"Successfully downloaded {file_name} to {file_path}")

        except Exception as e:
            logger.error(
                f"Failed to download model: {str(e)}", exc_info=True)
            # Clean up any partially downloaded files
            if self.model_path.exists():
                import shutil
                shutil.rmtree(self.model_path)
            raise ModelDownloadError(f"Failed to download model: {str(e)}")

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get model metadata."""
        if not self.model_path.exists():
            return None
        return {
            "model_type": "HQQ",
            "model_path": str(self.model_path),
            "file_size": self.model_path.stat().st_size,
            "backend": self.request.hqq_backend
        }

    def get_config(self) -> Dict[str, Any]:
        """Get model configuration."""
        return {
            "model_type": "HQQ",
            "model_name": self.request.model_name,
            "device": self.request.device,
            "backend": self.request.hqq_backend
        }
