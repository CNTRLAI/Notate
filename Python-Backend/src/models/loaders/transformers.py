import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import torch
from transformers import (
    BitsAndBytesConfig,
    PreTrainedModel,
)

from src.models.loaders.base import BaseLoader
from src.models.exceptions import ModelLoadError

logger = logging.getLogger(__name__)


class TransformersLoader(BaseLoader):
    """
    Loader for Hugging Face Transformers models.
    Handles both local and remote model loading with various optimizations.
    """

    def load(self) -> Tuple[Any, Any]:
        """Load a transformers model and return the model and tokenizer."""
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer

            logger.info(f"Loading model: {self.request.model_name}")
            logger.info(f"Model type: {self.request.model_type}")
            logger.info(f"Model path: {self.request.model_path}")
            logger.info(f"Device: {self.request.device}")

            # Configure model loading parameters
            model_kwargs = self._get_model_kwargs()

            # If we have a local path, use it directly
            if self.request.model_path and Path(self.request.model_path).exists():
                logger.info(
                    f"Loading model from local path: {self.request.model_path}")
                try:
                    # Try to load tokenizer from local path first
                    tokenizer = AutoTokenizer.from_pretrained(
                        self.request.model_path,
                        trust_remote_code=self.request.trust_remote_code,
                        use_fast=self.request.use_fast_tokenizer,
                        padding_side=self.request.padding_side
                    )
                    logger.info("Loaded tokenizer from local path")

                    # Load model from local path
                    model = AutoModelForCausalLM.from_pretrained(
                        self.request.model_path,
                        **model_kwargs
                    )
                    logger.info("Loaded model from local path")

                    # Ensure model is on the correct device if not using device_map
                    if model_kwargs.get("device_map") is None and hasattr(model, "to"):
                        # Handle device placement
                        if self.request.device == "auto":
                            device = "cuda" if torch.cuda.is_available() else "cpu"
                        else:
                            device = self.request.device

                        model = model.to(device)
                        logger.info(f"Moved model to device: {device}")

                    return model, tokenizer
                except Exception as e:
                    logger.warning(f"Failed to load from local path: {e}")
                    raise ModelLoadError(
                        f"Failed to load model from local path: {str(e)}")
            else:
                # Download from HuggingFace
                logger.info(
                    "Attempting to download from HuggingFace: " + self.request.model_name)

                try:
                    # Download and save tokenizer
                    tokenizer = AutoTokenizer.from_pretrained(
                        self.request.model_name,
                        trust_remote_code=self.request.trust_remote_code,
                        use_fast=self.request.use_fast_tokenizer,
                        padding_side=self.request.padding_side
                    )
                    if self.request.model_path:
                        tokenizer.save_pretrained(self.request.model_path)
                        logger.info(
                            f"Tokenizer downloaded and saved to {self.request.model_path}")

                    # Download and save config
                    if self.request.model_path:
                        from transformers import AutoConfig
                        config = AutoConfig.from_pretrained(
                            self.request.model_name,
                            trust_remote_code=self.request.trust_remote_code
                        )
                        config.save_pretrained(self.request.model_path)
                        logger.info(
                            f"Config downloaded and saved to {self.request.model_path}")

                    # Download model weights
                    logger.info(
                        "Downloading model weights (this may take a while)...")
                    model = AutoModelForCausalLM.from_pretrained(
                        self.request.model_name,
                        **model_kwargs
                    )

                    # Save the model if we have a path
                    if self.request.model_path:
                        model.save_pretrained(self.request.model_path)
                        logger.info(
                            f"Model weights saved to {self.request.model_path}")

                    return model, tokenizer
                except Exception as e:
                    raise ModelLoadError(f"Failed to download model: {str(e)}")

        except Exception as e:
            raise ModelLoadError(
                f"Failed to load transformers model: {str(e)}")

    def _get_model_kwargs(self) -> Dict[str, Any]:
        """Get model loading parameters."""
        # Get the compute dtype
        compute_dtype = torch.bfloat16 if self.request.compute_dtype == "bfloat16" else torch.float16

        # Determine device map
        device_map = None
        if self.request.device == "cuda":
            if torch.cuda.is_available():
                device_map = "auto"
            else:
                logger.warning(
                    "CUDA requested but not available, falling back to CPU")
                self.request.device = "cpu"

        # Base parameters without gradient checkpointing
        load_params = {
            "low_cpu_mem_usage": True,
            "torch_dtype": compute_dtype,
            "trust_remote_code": self.request.trust_remote_code,
            "use_flash_attention_2": self.request.use_flash_attention,
            "device_map": device_map,
            "revision": self.request.revision,
        }

        # Only add gradient checkpointing for explicitly supported models
        model_name_lower = self.request.model_name.lower()
        if ("llama" in model_name_lower or
            "mistral" in model_name_lower or
                "mpt" in model_name_lower):
            load_params["use_gradient_checkpointing"] = True

        # Configure quantization
        if self.request.load_in_8bit or self.request.load_in_4bit:
            load_params["quantization_config"] = self._get_quantization_config()

        # Add optional parameters
        if self.request.max_memory is not None and self.request.device == "cuda":
            load_params["max_memory"] = self.request.max_memory

        if self.request.rope_scaling is not None:
            load_params["rope_scaling"] = self.request.rope_scaling

        if self.request.use_cache is False:
            load_params["use_cache"] = False

        # For model loading, return the original params with torch.dtype
        if not hasattr(self, '_serializing_for_response'):
            return load_params

        # For JSON response, convert torch.dtype to string
        response_params = load_params.copy()
        response_params["torch_dtype"] = str(compute_dtype)
        return response_params  # Return string version for JSON serialization

    def _get_quantization_config(self) -> BitsAndBytesConfig:
        """Get quantization configuration."""
        return BitsAndBytesConfig(
            load_in_8bit=self.request.load_in_8bit,
            load_in_4bit=self.request.load_in_4bit,
            bnb_4bit_compute_dtype=eval(f"torch.{self.request.compute_dtype}"),
            llm_int8_enable_fp32_cpu_offload=True,
            bnb_4bit_use_double_quant=True
        )

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        """Get model metadata without loading the full model."""
        try:
            if '/' in self.request.model_name and not self.model_path.exists():
                config = self._load_config(self.request.model_name)
                metadata = self._make_json_serializable(config.to_dict())
                metadata['model_type'] = 'Transformers'
                return metadata

            if self.model_path.exists():
                config = self._load_config(self.model_path)
                metadata = self._make_json_serializable(config.to_dict())
                metadata['model_type'] = 'Transformers'
                return metadata

            return None
        except Exception as e:
            logger.error(f"Error getting model metadata: {str(e)}")
            return None

    def get_config(self) -> Dict[str, Any]:
        """Get the current model configuration."""
        # Set flag to get JSON serializable params
        self._serializing_for_response = True
        load_params = self._get_model_kwargs()
        delattr(self, '_serializing_for_response')

        config = {
            "model_type": "Transformers",
            "model_name": self.request.model_name,
            "device": self.request.device,
            "load_params": load_params
        }

        if self.model_path.exists():
            try:
                model_config = self._load_config(self.model_path)
                config["model_config"] = model_config.to_dict()
            except Exception as e:
                logger.warning(f"Could not load model config: {str(e)}")

        return self._make_json_serializable(config)

    def _make_json_serializable(self, obj: Any) -> Any:
        """Convert a dictionary with torch dtypes to JSON serializable format."""
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(v) for v in obj]
        elif hasattr(obj, 'dtype'):  # Handle torch dtypes
            return str(obj)
        return obj

    @staticmethod
    def cleanup(model: PreTrainedModel) -> None:
        """Clean up model resources."""
        try:
            if hasattr(model, 'cpu'):
                model.cpu()
            del model
        except Exception as e:
            logger.warning(f"Error during model cleanup: {str(e)}")
