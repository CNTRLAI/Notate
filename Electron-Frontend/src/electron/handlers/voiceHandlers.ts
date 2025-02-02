import { ipcMainHandle } from "../util.js";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import ffmpegStatic from "ffmpeg-static";
import log from "electron-log";
import { spawn } from "child_process";
import { audioTranscription } from "../voice/audioTranscription.js";

log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("userData"), "logs/main.log");

export function setupVttHandlers() {
  // Set FFMPEG_PATH environment variable for Python to use
  let ffmpegPath = ffmpegStatic as unknown as string | null;

  // In production, use the bundled FFmpeg
  if (app.isPackaged) {
    ffmpegPath = path.join(process.resourcesPath, "ffmpeg");
    if (process.platform === "win32") {
      ffmpegPath += ".exe";
    }
  }

  if (ffmpegPath) {
    process.env.FFMPEG_PATH = ffmpegPath;
    log.info(`Setting FFMPEG_PATH to: ${ffmpegPath}`);
  }

  ipcMainHandle("checkIfFFMPEGInstalled", async () => {
    const checkResult = { success: false, message: false };

    if (!ffmpegPath) {
      log.error("FFmpeg binary not found");
      return checkResult;
    }

    if (!fs.existsSync(ffmpegPath)) {
      log.error(`FFmpeg binary not found at path: ${ffmpegPath}`);
      return checkResult;
    }

    return new Promise((resolve) => {
      const ffmpeg = spawn(ffmpegPath!, ["-version"]);

      ffmpeg.on("error", (err: Error) => {
        log.error(`Error executing FFmpeg: ${err}`);
        resolve(checkResult);
      });

      ffmpeg.on("close", (code: number) => {
        const success = code === 0;
        log.info(`FFmpeg check completed with code ${code}`);
        resolve({ success, message: success });
      });
    }).catch(() => checkResult);
  });

  ipcMainHandle<
    "transcribeAudio",
    { audioData: Buffer; userId: number },
    TranscribeAudioOutput
  >("transcribeAudio", async (_event, { audioData, userId }) => {
    const data = await audioTranscription(audioData, userId);
    if (!data) {
      return {
        success: false,
        error: "Error transcribing audio",
      };
    }
    return {
      success: true,
      transcription: data.transcription,
      language: data.language,
    };
  });
}
