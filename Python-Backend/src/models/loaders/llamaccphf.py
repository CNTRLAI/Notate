from typing import Any, Tuple

from src.models.loaders.llamacpp import LlamaCppLoader


class LlamaCppHFLoader(LlamaCppLoader):
    """
    Loader for llama.cpp models with HuggingFace tokenizer.
    Inherits from LlamaCppLoader but uses a separate HF tokenizer.
    """

    def load(self) -> Tuple[Any, Any]:
        """Load model with HuggingFace tokenizer."""
        from transformers import AutoTokenizer

        # Load the base model
        model, _ = super().load()

        # Load HuggingFace tokenizer
        tokenizer_path = self.request.tokenizer_path or (
            self.request.model_path if self.request.model_path else f"models/{self.request.model_name}")

        tokenizer = AutoTokenizer.from_pretrained(
            tokenizer_path,
            trust_remote_code=self.request.trust_remote_code,
            use_fast=self.request.use_fast_tokenizer,
        )

        return model, tokenizer