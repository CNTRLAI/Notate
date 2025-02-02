import logging
from typing import Any, Dict, Optional, Tuple

from src.models.loaders.base import BaseLoader
from src.models.exceptions import ModelLoadError
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)


class TensorRTLoader(BaseLoader):
    """Loader for TensorRT-LLM models."""

    def load(self) -> Tuple[Any, Any]:
        """Load a TensorRT-LLM model."""
        try:
            import tensorrt_llm
            from tensorrt_llm.runtime import ModelConfig
        except ImportError:
            raise ModelLoadError(
                "tensorrt-llm is not installed. Please install it from the TensorRT-LLM repository")

        engine_path = self.request.engine_dir if self.request.engine_dir else self.model_path
        if not engine_path.exists():
            raise ModelLoadError(f"Engine path does not exist: {engine_path}")

        config = ModelConfig(
            engine_dir=str(engine_path),
            max_batch_size=self.request.max_batch_size,
            max_input_len=self.request.max_input_len,
            max_output_len=int(
                self.request.max_output_len) if self.request.max_output_len is not None else None,
        )

        model = tensorrt_llm.runtime.GenerationSession(config)

        tokenizer = AutoTokenizer.from_pretrained(
            self.request.tokenizer_path or str(engine_path),
            trust_remote_code=self.request.trust_remote_code,
            use_fast=self.request.use_fast_tokenizer,
        )

        return model, tokenizer

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get model metadata."""
        if not self.model_path.exists():
            return None
        return {
            "model_type": "TensorRT-LLM",
            "model_path": str(self.model_path),
            "file_size": self.model_path.stat().st_size,
            "engine_dir": self.request.engine_dir
        }

    def get_config(self) -> Dict[str, Any]:
        """Get model configuration."""
        return {
            "model_type": "TensorRT-LLM",
            "model_name": self.request.model_name,
            "device": self.request.device,
            "engine_dir": self.request.engine_dir,
            "max_batch_size": self.request.max_batch_size,
            "max_input_len": self.request.max_input_len,
            "max_output_len": self.request.max_output_len
        }
