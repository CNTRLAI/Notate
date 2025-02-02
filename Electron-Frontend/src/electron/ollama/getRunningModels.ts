import { spawn } from "child_process";
import { getOllamaPath } from "./ollamaPath.js";

export async function getRunningModels(): Promise<string[]> {
  try {
    return new Promise((resolve) => {
      const ps = spawn(getOllamaPath(), ["ps"], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";
      ps.stdout.on("data", (data) => {
        output += data.toString();
      });

      ps.on("close", () => {
        // Parse the output to get model names
        const lines = output.split("\n").slice(1); // Skip header line
        const models = lines
          .map((line) => line.trim())
          .filter((line) => line) // Remove empty lines
          .map((line) => line.split(/\s+/)[0]); // Get first column (NAME)
        resolve(models);
      });
    });
  } catch (error) {
    console.error("Error getting running models:", error);
    return [];
  }
}
