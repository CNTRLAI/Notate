import log from "electron-log";
import { spawn } from "child_process";

export async function isOllamaServerRunning(): Promise<boolean> {
  try {
    return new Promise((resolve) => {
        const check = spawn("curl", ["http://localhost:11434/api/version"], {
          stdio: ["ignore", "ignore", "ignore"],
        });
  
        check.on("close", (code) => {
          resolve(code === 0);
        });
      });
    } catch (error) {
      log.error("Error checking if Ollama server is running:", error);
      return false;
    }
  }