import { ExecException } from "child_process";
import { exec } from "child_process";
import { platform } from "os";
import log from "electron-log";

export async function checkOllama(): Promise<boolean> {
  log.info("Checking if Ollama is installed...");
  return new Promise((resolve) => {
    try {
      // Try common Ollama installation paths based on platform
      const ollamaPath =
        platform() === "darwin" ? "/usr/local/bin/ollama" : "ollama"; // fallback to PATH lookup

      exec(`${ollamaPath} ps`, (error: ExecException | null) => {
        if (error) {
          log.info(`Ollama installation check failed: ${error?.message}`);
          // If the direct path fails on macOS, try PATH lookup as fallback
          if (platform() === "darwin") {
            log.info("Trying PATH lookup for Ollama...");
            exec("ollama ps", (fallbackError: ExecException | null) => {
              resolve(!fallbackError);
            });
            return;
          }
          resolve(false);
          return;
        }
        resolve(true);
      });
    } catch {
      // Catch any unexpected errors and resolve false
      resolve(false);
    }
  });
}
