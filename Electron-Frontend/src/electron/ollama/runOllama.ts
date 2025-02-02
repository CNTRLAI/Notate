import { spawn } from "child_process";
import { ChildProcess } from "child_process";
import { BrowserWindow } from "electron";
import log from "electron-log";
import { pullModel } from "./pullModel.js";
import { isOllamaServerRunning } from "./isOllamaRunning.js";
import { unloadAllModels } from "./unloadAllModels.js";
import { getOllamaPath } from "./ollamaPath.js";

declare global {
  // eslint-disable-next-line no-var
  var mainWindow: BrowserWindow | null;
}

async function startOllamaServer(): Promise<void> {
  try {
    log.info("Starting Ollama server...");
    const server = spawn(getOllamaPath(), ["serve"], {
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    return new Promise((resolve) => {
      // Wait for server to start
      let output = "";
      server.stdout?.on("data", (data) => {
        output += data.toString();
        if (output.includes("Starting Ollama")) {
          log.info("Ollama server started successfully");
          resolve();
        }
      });

      server.stderr?.on("data", (data) => {
        const error = data.toString();
        log.error("Server error:", error);
        if (error.includes("address already in use")) {
          resolve(); // Server is already running
        }
      });

      // Give it some time to start
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  } catch (error) {
    log.error("Error starting Ollama server:", error);
    throw error;
  }
}

async function createOllamaProcess(
  model: string
): Promise<{ process: ChildProcess; verified: boolean }> {
  try {
    // First, verify the model is responsive via API
    const verify = spawn(
      "curl",
      [
        "-X",
        "POST",
        "-s", // Silent mode
        "http://localhost:11434/api/embeddings",
        "-d",
        `{"model": "${model}", "prompt": "test"}`,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let verifyOutput = "";
    await new Promise((resolve) => {
      verify.stdout.on("data", (data) => {
        verifyOutput += data.toString();
        if (global.mainWindow) {
          global.mainWindow.webContents.send("ollama-progress", {
            type: "verify",
            output: data.toString(),
          });
        }
      });

      verify.stderr.on("data", (data) => {
        // Emit progress event for stderr
        if (global.mainWindow) {
          global.mainWindow.webContents.send("ollama-progress", {
            type: "verify",
            output: data.toString(),
          });
        }
      });

      verify.on("close", (code) => {
        if (code === 0 && verifyOutput) {
          console.log("Model verified via API");
          resolve(null);
        } else {
          console.log("Model verification failed, will try direct process");
          resolve(null);
        }
      });
    });

    // Now start the actual process
    console.log("Starting Ollama process...");
    const ollamaProcess = spawn(getOllamaPath(), ["run", model], {
      stdio: ["pipe", "pipe", "pipe"],
      detached: false,
    });

    (ollamaProcess.stdin as NodeJS.WriteStream).setEncoding("utf-8");
    return {
      process: ollamaProcess,
      verified: verifyOutput.includes("embedding"),
    };
  } catch (error) {
    console.error("Error creating Ollama process:", error);
    throw error;
  }
}

export async function runOllama({
  model,
}: {
  model: string;
}): Promise<ChildProcess> {
  try {
    console.log(`Using model: ${model}`);

    // Ensure Ollama server is running
    const serverRunning = await isOllamaServerRunning();
    if (!serverRunning) {
      console.log("Ollama server not running, starting it...");
      await startOllamaServer();
      // Wait a bit for the server to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Unload all running models first
    try {
      await unloadAllModels();
    } catch (error) {
      console.log("Error unloading models (this is not critical):", error);
    }

    try {
      // Always try to pull the model first
      await pullModel(model);
    } catch (error) {
      console.error("Error pulling model:", error);
      throw error;
    }

    let ollamaProcess: ChildProcess;
    let isVerified = false;
    try {
      console.log("Creating Ollama process...");
      const result = await createOllamaProcess(model);
      ollamaProcess = result.process;
      isVerified = result.verified;
    } catch (error) {
      console.error("Error creating Ollama process:", error);
      throw error;
    }

    return new Promise((resolve, reject) => {
      if (
        !ollamaProcess.stdout ||
        !ollamaProcess.stderr ||
        !ollamaProcess.stdin
      ) {
        reject(new Error("Failed to create process streams"));
        return;
      }

      // For embedding models, we consider them loaded once the process starts
      if (model.includes("embedding")) {
        console.log("Embedding model detected, considering it loaded");
        resolve(ollamaProcess);
        return;
      }

      // If we got this far and the model was verified via API, resolve immediately
      if (isVerified) {
        console.log("Model already verified via API, resolving immediately");
        resolve(ollamaProcess);
        return;
      }

      let isModelLoaded = false;
      let startupOutput = "";

      ollamaProcess.stdout.on("data", (data) => {
        const output = data.toString();
        startupOutput += output;
        console.log(`Ollama output: ${output}`);

        if (!isModelLoaded) {
          isModelLoaded = true;
          console.log("Model loaded successfully");
          resolve(ollamaProcess);
        }
      });

      ollamaProcess.stderr.on("data", (data) => {
        const error = data.toString();
        startupOutput += error;
        console.error(`Ollama error: ${error}`);

        // Also consider loading animation as success
        if (
          !isModelLoaded &&
          (error.includes("⠋") ||
            error.includes("⠙") ||
            error.includes("⠹") ||
            error.includes("⠸"))
        ) {
          isModelLoaded = true;
          console.log(
            "Model loaded successfully (detected from loading animation)"
          );
          resolve(ollamaProcess);
        }
      });

      ollamaProcess.on("error", (error) => {
        console.error(`Failed to start Ollama: ${error.message}`);
        reject(error);
      });

      ollamaProcess.on("exit", (code) => {
        if (!isModelLoaded) {
          console.error(`Process exit with startup output: ${startupOutput}`);
          reject(
            new Error(
              `Ollama process exited with code ${code}. Full output: ${startupOutput}`
            )
          );
        }
      });

      // Add a timeout to prevent hanging
      setTimeout(() => {
        if (!isModelLoaded) {
          try {
            ollamaProcess.kill();
          } catch (error) {
            console.error("Error killing process:", error);
          }
          reject(
            new Error(
              `Timeout waiting for Ollama model ${model} to load. Output: ${startupOutput}`
            )
          );
        }
      }, 30000); // 30 second timeout
    });
  } catch (error) {
    console.error("Error in runOllama:", error);
    throw error;
  }
}
