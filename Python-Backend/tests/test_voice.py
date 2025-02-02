import pytest
from fastapi.testclient import TestClient
from main import app
import os
import tempfile
import wave
import numpy as np
import sounddevice as sd


client = TestClient(app)

def create_test_wav(duration=3.0, frequency=440.0, sample_rate=16000):
    """Create a test WAV file with a sine wave."""
    # Generate time array
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Generate sine wave
    note = np.sin(2 * np.pi * frequency * t)
    
    # Normalize to 16-bit range and convert to integers
    audio = note * 32767
    audio = audio.astype(np.int16)
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    # Write WAV file
    with wave.open(temp_file.name, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes per sample (16-bit)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio.tobytes())
    
    return temp_file.name

def test_voice_to_text_basic():
    """Test basic voice-to-text functionality with a generated WAV file."""
    # Create a test WAV file
    test_file = create_test_wav()
    
    try:
        with open(test_file, 'rb') as f:
            files = {'audio_file': ('test.wav', f, 'audio/wav')}
            response = client.post("/voice-to-text", files=files)
            
        assert response.status_code == 200
        result = response.json()
        assert "status" in result
        assert "text" in result
        assert "language" in result
        assert "segments" in result
        
    finally:
        # Clean up the test file
        os.unlink(test_file)

def test_voice_to_text_models():
    """Test voice-to-text with different Whisper models."""
    test_file = create_test_wav()
    
    try:
        models = ['tiny', 'base', 'small']  # We'll test with smaller models for speed
        
        for model in models:
            with open(test_file, 'rb') as f:
                files = {'audio_file': ('test.wav', f, 'audio/wav')}
                response = client.post("/voice-to-text", 
                                    files=files,
                                    data={'model_name': model})
                
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"
            
    finally:
        os.unlink(test_file)

def test_voice_to_text_invalid_audio():
    """Test voice-to-text with invalid audio data."""
    # Create an invalid audio file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
        temp_file.write(b'This is not valid audio data')
    
    try:
        with open(temp_file.name, 'rb') as f:
            files = {'audio_file': ('invalid.wav', f, 'audio/wav')}
            response = client.post("/voice-to-text", files=files)
        
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "error"
        assert "error" in result
        
    finally:
        os.unlink(temp_file.name)

def test_voice_to_text_missing_file():
    """Test voice-to-text without providing an audio file."""
    response = client.post("/voice-to-text")
    assert response.status_code == 422  # FastAPI validation error

def test_voice_to_text_long_audio():
    """Test voice-to-text with a longer audio file."""
    test_file = create_test_wav(duration=10.0)  # 10 seconds
    
    try:
        with open(test_file, 'rb') as f:
            files = {'audio_file': ('long.wav', f, 'audio/wav')}
            response = client.post("/voice-to-text", files=files)
            
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert "text" in result
        assert "language" in result
        assert "segments" in result
        
    finally:
        os.unlink(test_file)

def test_voice_to_text_different_frequencies():
    """Test voice-to-text with different audio frequencies."""
    frequencies = [440.0, 880.0, 1760.0]  # A4, A5, A6 notes
    
    for freq in frequencies:
        test_file = create_test_wav(frequency=freq)
        
        try:
            with open(test_file, 'rb') as f:
                files = {'audio_file': (f'freq_{freq}.wav', f, 'audio/wav')}
                response = client.post("/voice-to-text", files=files)
                
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"
            
        finally:
            os.unlink(test_file)

def record_audio(duration=5, sample_rate=16000):
    """Record audio from the microphone."""
    print(f"Recording for {duration} seconds...")
    audio_data = sd.rec(int(duration * sample_rate),
                       samplerate=sample_rate,
                       channels=1,
                       dtype=np.int16)
    sd.wait()  # Wait until recording is finished
    return audio_data

def test_live_voice_to_text(capsys):
    """Test voice-to-text with live microphone input."""
    # Record audio
    sample_rate = 16000
    duration = 5  # 5 seconds of recording
    
    with capsys.disabled():
        print("\n=== Live Voice-to-Text Test ===")
        print("Please speak into your microphone...")
        audio_data = record_audio(duration, sample_rate)
    
    # Create a temporary WAV file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    try:
        # Save the recorded audio to WAV file
        with wave.open(temp_file.name, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
        
        # Send the recorded audio for transcription
        with open(temp_file.name, 'rb') as f:
            files = {'audio_file': ('recording.wav', f, 'audio/wav')}
            response = client.post("/voice-to-text", files=files)
        
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert "text" in result
        
        with capsys.disabled():
            print(f"\nTranscribed text: {result['text']}")
            print("================================\n")
        
    finally:
        os.unlink(temp_file.name)

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 