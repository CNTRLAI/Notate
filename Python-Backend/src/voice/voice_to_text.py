import whisper
import os
import warnings
import torch
import shutil
import subprocess

# Suppress specific warnings
warnings.filterwarnings(
    "ignore", message=".*weights_only=False.*", category=FutureWarning)
warnings.filterwarnings(
    "ignore", message="FP16 is not supported on CPU; using FP32 instead")
warnings.filterwarnings("ignore", category=FutureWarning,
                        module="torch.serialization")

# Global variables
model = None
ffmpeg_path = None


def initialize_model(model_name: str = "base"):
    """Initialize the Whisper model with optimal device and precision settings."""
    global model, ffmpeg_path
    if model is None:
        # Get FFmpeg path from environment variable
        ffmpeg_path = os.environ.get('FFMPEG_PATH')
        if ffmpeg_path:
            try:
                # Verify FFmpeg works
                subprocess.run([ffmpeg_path, "-version"],
                               capture_output=True, check=True)
                print(f"FFmpeg verified at: {ffmpeg_path}")
                # Set environment variables for Whisper
                os.environ["PATH"] = os.pathsep.join(
                    [os.path.dirname(ffmpeg_path), os.environ.get('PATH', '')])
                os.environ["FFMPEG_BINARY"] = ffmpeg_path
            except Exception as e:
                print(f"Warning: Error verifying FFmpeg at {ffmpeg_path}: {e}")
                ffmpeg_path = None

        if not ffmpeg_path:
            # Try to find system FFmpeg
            ffmpeg_system = shutil.which('ffmpeg')
            if ffmpeg_system:
                ffmpeg_path = ffmpeg_system
                os.environ["FFMPEG_BINARY"] = ffmpeg_path
                print(f"Using system FFmpeg from: {ffmpeg_path}")
            else:
                print("FFmpeg not found or not working")
                return None

        # Initialize Whisper model
        device = "cuda" if torch.cuda.is_available() else "cpu"
        fp16 = device == "cuda"

        print(f"Loading Whisper model '{model_name}' on {device}...")
        model = whisper.load_model(model_name)
        model.to(device)

        if device == "cuda" and fp16:
            model = model.half()
            print(f"Using GPU with FP16={fp16}")
        else:
            print("Using CPU with FP32")

    return model
