from src.voice.voice_to_text import initialize_model

import os
import tempfile
from fastapi import UploadFile, File, HTTPException

# Global variables
model = None
ffmpeg_path = None


async def transcribe_audio(audio_file: UploadFile = File(...), model_name: str = "base") -> dict:
    """Transcribe audio using Whisper."""
    temp_file = None
    try:
        # Initialize model and verify FFmpeg is available
        model = initialize_model(model_name)
        if not model:
            raise HTTPException(
                status_code=500, detail="FFmpeg not found or not working")

        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        content = await audio_file.read()
        temp_file.write(content)
        temp_file.flush()
        temp_file.close()

        result = model.transcribe(temp_file.name)

        return {
            "status": "success",
            "text": result["text"],
            "language": result.get("language", "unknown"),
            "segments": result.get("segments", [])
        }

    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }
    finally:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
                print(f"Deleted temporary file: {temp_file.name}")
            except Exception as e:
                print(
                    f"Warning: Could not delete temporary file {temp_file.name}: {str(e)}")
