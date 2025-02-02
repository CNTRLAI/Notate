from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Literal


class EmbeddingRequest(BaseModel):
    file_path: str
    api_key: Optional[str] = None
    collection: int
    collection_name: str
    user: int
    metadata: Optional[Dict[str, Any]] = None
    is_local: Optional[bool] = False
    local_embedding_model: Optional[str] = "granite-embedding:278m"


class ModelLoadRequest(BaseModel):
    model_name: str
    model_type: Optional[str] = "auto"  # 'auto', 'Transformers', 'llama.cpp', 'llamacpp_HF', 'ExLlamav2', 'ExLlamav2_HF', 'HQQ', 'TensorRT-LLM'
    device: Optional[str] = "auto"  # 'cpu', 'cuda', 'auto'
    
    # Transformers specific settings
    load_in_8bit: Optional[bool] = False
    load_in_4bit: Optional[bool] = False
    use_flash_attention: Optional[bool] = False
    trust_remote_code: Optional[bool] = True
    use_safetensors: Optional[bool] = True
    max_memory: Optional[Dict[str, str]] = None
    compute_dtype: Optional[str] = "float16"  # float16, bfloat16, float32
    rope_scaling: Optional[Dict[str, Any]] = None
    use_cache: Optional[bool] = True
    revision: Optional[str] = None
    padding_side: Optional[str] = "right"
    use_fast_tokenizer: Optional[bool] = True
    hf_token: Optional[str] = None  # HuggingFace token for gated models
    
    # ExLlamav2 specific settings
    max_seq_len: Optional[int] = None
    compress_pos_emb: Optional[float] = 1.0
    alpha_value: Optional[float] = 1
    
    # llama.cpp specific settings
    n_ctx: Optional[int] = 2048
    n_batch: Optional[int] = 512
    n_threads: Optional[int] = None
    n_threads_batch: Optional[int] = None
    n_gpu_layers: Optional[int] = 32
    main_gpu: Optional[int] = 0
    tensor_split: Optional[List[float]] = None
    mul_mat_q: Optional[bool] = True
    use_mmap: Optional[bool] = True
    use_mlock: Optional[bool] = False
    offload_kqv: Optional[bool] = False
    split_mode: Optional[str] = None
    flash_attn: Optional[bool] = False
    cache_type: Optional[str] = None
    cache_size: Optional[int] = None
    rope_scaling_type: Optional[str] = None
    rope_freq_base: Optional[float] = None
    rope_freq_scale: Optional[float] = None
    
    # HQQ specific settings
    hqq_backend: Optional[str] = "PYTORCH_COMPILE"  # PYTORCH_COMPILE, ATEN, TENSORRT
    
    # TensorRT-LLM specific settings
    engine_dir: Optional[str] = None
    max_batch_size: Optional[int] = 1
    max_input_len: Optional[int] = 2048
    max_output_len: Optional[int] = 512
    
    # Common settings
    model_path: Optional[str] = None  # Custom path to model files if not in default location
    tokenizer_path: Optional[str] = None  # Custom path to tokenizer if different from model path
    
    class Config:
        protected_namespaces = ()

class VectorStoreQueryRequest(BaseModel):
    query: str
    collection: Optional[int] = None
    collection_name: str
    user: int
    api_key: Optional[str] = None
    top_k: int = 5
    is_local: Optional[bool] = False
    local_embedding_model: Optional[str] = "granite-embedding:278m"
    prompt: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.5
    max_completion_tokens: Optional[int] = 2048
    top_p: Optional[float] = 1
    frequency_penalty: Optional[float] = 0
    presence_penalty: Optional[float] = 0
    is_ooba: Optional[bool] = False
    character: Optional[str] = None
    is_ollama: Optional[bool] = False


class YoutubeTranscriptRequest(BaseModel):
    url: str
    user_id: int
    collection_id: int
    username: str
    collection_name: str
    api_key: Optional[str] = None
    is_local: Optional[bool] = False
    local_embedding_model: Optional[str] = "granite-embedding:278m"


class DeleteCollectionRequest(BaseModel):
    collection_id: int
    collection_name: str
    is_local: Optional[bool] = False
    api_key: Optional[str] = None


class WebCrawlRequest(BaseModel):
    base_url: str
    max_workers: int
    collection_name: str
    collection_id: int
    user_id: int
    user_name: str
    api_key: Optional[str] = None
    is_local: Optional[bool] = False
    local_embedding_model: Optional[str] = "granite-embedding:278m"


class QueryRequest(BaseModel):
    input: str
    prompt: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    collection_name: Optional[str] = None
    top_k: Optional[int] = 5
    temperature: Optional[float] = 0.5
    max_completion_tokens: Optional[int] = 2048
    top_p: Optional[float] = 1
    frequency_penalty: Optional[float] = 0
    presence_penalty: Optional[float] = 0
    is_local: Optional[bool] = False
    is_ooba: Optional[bool] = False
    local_embedding_model: Optional[str] = "granite-embedding:278m"
    character: Optional[str] = None
    is_ollama: Optional[bool] = False


class Message(BaseModel):
    """A single message in a chat completion request"""
    role: Literal["system", "user", "assistant"]
    content: str
    name: Optional[str] = None


class ChatCompletionRequest(BaseModel):
    """Request model for chat completion"""
    messages: List[Message]
    model: str = "local-model"
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95
    top_k: Optional[int] = 50
    n: Optional[int] = 1
    max_tokens: Optional[int] = 2048
    presence_penalty: Optional[float] = 0.1
    frequency_penalty: Optional[float] = 0.1
    repetition_penalty: Optional[float] = 1.1
    stop: Optional[List[str]] = None
    stream: Optional[bool] = True
    is_local: Optional[bool] = False
    is_ooba: Optional[bool] = False
    is_ollama: Optional[bool] = False

class GenerateRequest(BaseModel):
    """Request model for raw text generation"""
    prompt: str
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95
    top_k: Optional[int] = 50
    repetition_penalty: Optional[float] = 1.1
    stop_sequences: Optional[List[str]] = None
    echo: Optional[bool] = False
    stream: Optional[bool] = True
