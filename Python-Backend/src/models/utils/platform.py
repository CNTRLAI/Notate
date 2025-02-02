import platform
from typing import Tuple


def check_platform_compatibility(model_type: str) -> Tuple[bool, str]:
    """
    Check if the model type is compatible with the current platform
    Returns (is_compatible, message)
    """
    current_platform = platform.system().lower()

    platform_compatibility = {
        'TensorRT-LLM': ['linux'],  # TensorRT only works on Linux
        # ExLlama works on Windows and Linux
        'ExLlamav2': ['windows', 'linux'],
        'ExLlamav2_HF': ['windows', 'linux'],
        # HQQ works on all platforms
        'HQQ': ['linux', 'windows', 'darwin'],
        # llama.cpp works on all platforms
        'llama.cpp': ['linux', 'windows', 'darwin'],
        'llamacpp_HF': ['linux', 'windows', 'darwin'],
        # Transformers works on all platforms
        'Transformers': ['linux', 'windows', 'darwin'],
        'ollama': ['linux', 'windows', 'darwin']
    }

    compatible_platforms = platform_compatibility.get(model_type, [])
    is_compatible = current_platform in compatible_platforms

    if not is_compatible:
        message = f"Model type '{model_type}' is not compatible with {platform.system()}. Compatible platforms: {', '.join(compatible_platforms)}"
    else:
        message = f"Model type '{model_type}' is compatible with {platform.system()}"

    return is_compatible, message
