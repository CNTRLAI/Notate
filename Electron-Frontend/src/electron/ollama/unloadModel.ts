import { spawn } from "child_process";

export async function unloadModel(model: string): Promise<void> {
  try {
    console.log(`Unloading model ${model}...`);
    return new Promise((resolve, reject) => {
      const unload = spawn(
        "curl",
        [
          "-X",
          "POST",
          "http://localhost:11434/api/generate",
          "-d",
          `{"model": "${model}", "keep_alive": 0}`,
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      unload.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`Unload output: ${output}`);
      });

      unload.stderr.on("data", (data) => {
        const error = data.toString();
        console.log(`Unload error: ${error}`);
      });

      unload.on("error", (error) => {
        console.error(`Unload error: ${error.message}`);
        reject(error);
      });

      unload.on("close", (code) => {
        if (code === 0) {
          console.log("Model unloaded successfully");
          resolve();
        } else {
          console.error(`Unload failed with code ${code}`);
          reject(
            new Error(`Failed to unload model ${model} (exit code ${code})`)
          );
        }
      });
    });
  } catch (error) {
    console.error("Error unloading model:", error);
    throw error;
  }
}
