export class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  private static getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/wav",
      "audio/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    throw new Error("No supported audio MIME types found");
  }

  async startRecording(): Promise<void> {
    try {
      // Request high-quality audio with fallback options
      const constraints: MediaTrackConstraints = {
        channelCount: { ideal: 1 }, // Mono preferred for speech
        sampleRate: { ideal: 44100, min: 16000 }, // Fallback to lower sample rate if needed
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: constraints,
      });

      // Get supported mime type and configure options
      const mimeType = WebAudioRecorder.getSupportedMimeType();
      const options: MediaRecorderOptions = {
        mimeType,
        audioBitsPerSecond: 128000,
      };

      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options);
      } catch (err) {
        // Fallback to default options if custom options fail
        console.warn(
          "Failed to create MediaRecorder with options, falling back to defaults:",
          err
        );
        this.mediaRecorder = new MediaRecorder(this.stream);
      }

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Add error handler
      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        this.cleanup();
      };

      // Collect data more frequently for smoother recording
      this.mediaRecorder.start(100);
    } catch (error) {
      this.cleanup();
      console.error("Error starting recording:", error);
      throw new Error(
        `Failed to start recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async stopRecording(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("MediaRecorder not initialized"));
        return;
      }

      const timeoutId = setTimeout(() => {
        this.cleanup();
        reject(new Error("Recording stop timeout"));
      }, 5000); // 5 second timeout

      this.mediaRecorder.onstop = async () => {
        try {
          clearTimeout(timeoutId);
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const arrayBuffer = await audioBlob.arrayBuffer();

          this.cleanup();
          resolve(arrayBuffer);
        } catch (error) {
          this.cleanup();
          console.error("Error in onstop handler:", error);
          reject(
            error instanceof Error
              ? error
              : new Error("Unknown error while stopping recording")
          );
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (error) {
        clearTimeout(timeoutId);
        this.cleanup();
        console.error("Error stopping MediaRecorder:", error);
        reject(
          error instanceof Error ? error : new Error("Failed to stop recording")
        );
      }
    });
  }

  private cleanup(): void {
    try {
      if (this.mediaRecorder?.state === "recording") {
        this.mediaRecorder.stop();
      }
      this.audioChunks = [];
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }
      this.mediaRecorder = null;
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  cancelRecording(): void {
    this.cleanup();
  }
}
