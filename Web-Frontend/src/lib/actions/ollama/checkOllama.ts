import { ExecException } from "child_process";
import { exec } from "child_process";
import { platform } from "os";

export async function checkOllama(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Try common Ollama installation paths based on platform
      const ollamaPath =
        platform() === "darwin" ? "/usr/local/bin/ollama" : "ollama"; // fallback to PATH lookup

      exec(`${ollamaPath} ps`, (error: ExecException | null) => {
        if (error) {
          console.log(`Ollama installation check failed: ${error?.message}`);
          // If the direct path fails on macOS, try PATH lookup as fallback
          if (platform() === "darwin") {
            console.log("Trying PATH lookup for Ollama...");
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
