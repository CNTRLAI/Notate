import torch
from src.endpoint.models import ModelLoadRequest


def get_device(request: ModelLoadRequest) -> str:
    if request.device != "auto":
        return request.device

    if torch.cuda.is_available():
        print("CUDA is available")
        return "cuda"
    elif torch.backends.mps.is_available():
        print("MPS is available")
        return "mps"
    else:
        print("No GPU available")
        return "cpu"
