import { spawn } from "child_process";

export async function pullModel(model: string): Promise<void> {
  console.log(`Pulling model ${model}...`);
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
        console.log(`Pull output: ${output}`);
        // Emit progress event
      });

      pull.stderr.on("data", (data) => {
        const error = data.toString();
        console.log(`Pull progress: ${error}`);
        // Emit progress event for stderr as well
      });

      pull.on("error", (error) => {
        console.log(`Pull error: ${error.message}`);
        reject(error);
      });

      pull.on("close", (code) => {
        if (code === 0) {
          console.log("Model pull completed successfully");
          resolve();
        } else {
          console.log(`Pull failed with code ${code}`);
          reject(
            new Error(`Failed to pull model ${model} (exit code ${code})`)
          );
        }
      });
    });
  } catch (error) {
    console.log("Error pulling model:", error);
    throw error;
  }
}
