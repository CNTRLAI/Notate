import logging
from typing import Any, Dict, Optional, Tuple

from src.models.loaders.base import BaseLoader
from src.models.exceptions import ModelLoadError
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)


class ExLlamaV2Loader(BaseLoader):
    """Loader for ExLlamaV2 models."""

    def load(self) -> Tuple[Any, Any]:
        """Load an ExLlamav2 model."""
        try:
            from exllamav2 import ExLlamaV2, ExLlamaV2Config, ExLlamaV2Tokenizer
            import torch
        except ImportError:
            raise ModelLoadError(
                "exllamav2 is not installed. Please install it from the ExLlamaV2 repository")

        if not self.model_path.exists():
            raise ModelLoadError(
                f"Model path does not exist: {self.model_path}")

        # Clear CUDA cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info(f"CUDA Device: {torch.cuda.get_device_name(0)}")
            logger.info(
                f"CUDA Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**2:.0f}MB")

        if not torch.cuda.is_available():
            raise ModelLoadError("GPU is required for ExLlama2")

        # Force CUDA device
        torch.set_default_device('cuda')
        torch.set_default_tensor_type('torch.cuda.FloatTensor')

        config = ExLlamaV2Config()
        config.model_dir = str(self.model_path)
        config.max_seq_len = self.request.max_seq_len or 2048
        config.compress_pos_emb = self.request.compress_pos_emb
        config.alpha_value = self.request.alpha_value
        config.calculate_rotary_embedding_base()  # Important for GPU performance

        logger.info(f"Loading model with config: {config.__dict__}")
        model = ExLlamaV2(config)

        # Force model to GPU
        model.load()
        for param in model.parameters():
            param.data = param.data.cuda()

        logger.info(
            f"Model loaded on GPU. CUDA Memory: {torch.cuda.memory_allocated() / 1024**2:.0f}MB")
        logger.info(
            f"Device for first parameter: {next(model.parameters()).device}")

        tokenizer = ExLlamaV2Tokenizer(config)
        logger.info("Model and tokenizer loaded successfully")

        return model, tokenizer

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get model metadata."""
        if not self.model_path.exists():
            return None
        return {
            "model_type": "ExLlamav2",
            "model_path": str(self.model_path),
            "file_size": self.model_path.stat().st_size
        }

    def get_config(self) -> Dict[str, Any]:
        """Get model configuration."""
        return {
            "model_type": "ExLlamav2",
            "model_name": self.request.model_name,
            "device": self.request.device,
            "max_seq_len": self.request.max_seq_len,
            "compress_pos_emb": self.request.compress_pos_emb,
            "alpha_value": self.request.alpha_value
        }


class ExLlamaV2HFLoader(BaseLoader):
    """Loader for ExLlamaV2 models with HuggingFace tokenizer."""

    def load(self) -> Tuple[Any, Any]:
        """Load an ExLlamav2 model with HF tokenizer."""
        model = ExLlamaV2Loader(self.request, self.manager).load()[0]
        tokenizer_path = self.request.tokenizer_path or self.model_path

        tokenizer = AutoTokenizer.from_pretrained(
            tokenizer_path,
            trust_remote_code=self.request.trust_remote_code,
            use_fast=self.request.use_fast_tokenizer,
        )

        return model, tokenizer

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get model metadata."""
        return ExLlamaV2Loader(self.request, self.manager).get_metadata()

    def get_config(self) -> Dict[str, Any]:
        """Get model configuration."""
        return ExLlamaV2Loader(self.request, self.manager).get_config()
