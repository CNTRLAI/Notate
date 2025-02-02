import log from "electron-log";
import { spawn } from "child_process";

export async function pullModel(model: string): Promise<void> {
  log.info(`Pulling model ${model}...`);
  try {
    return new Promise((resolve, reject) => {
      const pull = spawn(
        "curl",
        [
          "-X",
          "POST",
          "http://localhost:11434/api/pull",
          "-d",
          `{"name": "${model}"}`,
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      pull.stdout.on("data", (data) => {
        const output = data.toString();
        log.info(`Pull output: ${output}`);
        // Emit progress event
        if (global.mainWindow) {
          global.mainWindow.webContents.send("ollama-progress", {
            type: "pull",
            output: output,
          });
        }
      });

      pull.stderr.on("data", (data) => {
        const error = data.toString();
        log.info(`Pull progress: ${error}`);
        // Emit progress event for stderr as well
        if (global.mainWindow) {
          global.mainWindow.webContents.send("ollama-progress", {
            type: "pull",
            output: error,
          });
        }
      });

      pull.on("error", (error) => {
        log.error(`Pull error: ${error.message}`);
        reject(error);
      });

      pull.on("close", (code) => {
        if (code === 0) {
          log.info("Model pull completed successfully");
          resolve();
        } else {
          log.error(`Pull failed with code ${code}`);
          reject(
            new Error(`Failed to pull model ${model} (exit code ${code})`)
          );
        }
      });
    });
  } catch (error) {
    log.error("Error pulling model:", error);
    throw error;
  }
}
