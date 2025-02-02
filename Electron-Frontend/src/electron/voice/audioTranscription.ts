import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import { getToken } from "../authentication/token.js";

export async function audioTranscription(audioData: Buffer, userId: number) {
  let filepath: string | null = null;
  try {
    const tempDir = path.join(app.getPath("temp"), "notate-audio");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = `recording-${Date.now()}.wav`;
    filepath = path.join(tempDir, filename);

    // Save the file locally first
    fs.writeFileSync(filepath, audioData);

    // Create form data with the saved file
    const formData = new FormData();
    const file = new Blob([fs.readFileSync(filepath)], { type: "audio/wav" });
    formData.append("audio_file", file, filename);
    formData.append("model_name", "base");
    const token = await getToken({ userId: userId.toString() });
    const response = await fetch("http://localhost:47372/transcribe", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Clean up temporary file
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    if (data.status === "error") {
      return {
        success: false,
        error: data.error || "Unknown error occurred during transcription",
      };
    }

    // Return the transcription data properly
    return {
      success: true,
      transcription: data.text,
      language: data.language,
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    // Clean up on error too
    if (filepath && fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
