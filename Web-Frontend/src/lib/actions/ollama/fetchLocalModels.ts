import { ExecException, exec } from "child_process";
import { platform } from "os";

const getOllamaPath = () =>
  platform() === "darwin" ? "/usr/local/bin/ollama" : "ollama";

export async function fetchOllamaModels(): Promise<string[]> {
  console.log("Fetching Ollama models...");
  try {
    return new Promise((resolve) => {
      exec(
        `${getOllamaPath()} list`,
        (error: ExecException | null, stdout: string) => {
          if (error) {
            console.log(`Error executing ollama list: ${error?.message}`);
            // If the direct path fails on macOS, try PATH lookup as fallback
            if (platform() === "darwin") {
              exec(
                "ollama list",
                (
                  fallbackError: ExecException | null,
                  fallbackStdout: string
                ) => {
                  if (fallbackError) {
                    console.log("Error executing ollama list:", fallbackError);
                    resolve([]);
                    return;
                  }
                  const models = fallbackStdout
                    .split("\n")
                    .slice(1)
                    .filter((line) => line.trim())
                    .map((line) => line.split(/\s+/)[0]);
                  console.log(`Fetched models: ${models}`);
                  resolve(models);
                }
              );
              return;
            }
            console.log("Error executing ollama list:", error);
            resolve([]);
            return;
          }

          const models = stdout
            .split("\n")
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => line.split(/\s+/)[0]);

          resolve(models);
        }
      );
    });
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}
