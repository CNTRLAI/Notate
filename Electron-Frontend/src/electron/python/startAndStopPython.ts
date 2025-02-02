import { app } from "electron";
import { spawn, ChildProcess, SpawnOptions } from "child_process";
import path from "path";
import { isDev } from "../util.js";
import { updateLoadingStatus } from "../loadingWindow.js";
import fs from "fs";
import log from "electron-log";
import ffmpegStatic from "ffmpeg-static";
import { generateSecret } from "../authentication/secret.js";
import { getSecret } from "../authentication/devApi.js";
import { ensurePythonAndVenv } from "./ensurePythonAndVenv.js";
import { extractFromAsar } from "./extractFromAsar.js";
import { killProcessOnPort } from "./killProcessOnPort.js";

log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("userData"), "logs/main.log");

let pythonProcess: ChildProcess | null = null;

export async function startPythonServer() {
  log.info("Application starting...");
  log.info("Creating window...");
  const appPath = app.getAppPath();
  log.info(`App path: ${appPath}`);

  // Generate JWT secret before starting the server
  const jwtSecret = generateSecret();

  let backendPath;
  if (isDev()) {
    // In dev mode, Backend is one level up from the Frontend directory
    backendPath = path.join(appPath, "..", "Python-Backend");
    log.info(`Dev mode: Backend path set to ${backendPath}`);
  } else {
    // In production, try both "Backend" and "backend" paths
    const backendPaths = [
      path.join(process.resourcesPath, "Python-Backend"),
      path.join(process.resourcesPath, "python-backend"),
    ];

    for (const testPath of backendPaths) {
      if (fs.existsSync(testPath)) {
        backendPath = testPath;
        log.info(`Prod mode: Found backend at ${backendPath}`);
        break;
      }
    }

    if (!backendPath) {
      const tempPath = path.join(app.getPath("temp"), "notate-backend");
      log.info(`Prod mode: Temp path set to ${tempPath}`);

      // Try both capitalization variants in ASAR
      const asarBackendPaths = [
        path.join(appPath, "Python-Backend"),
        path.join(appPath, "python-backend"),
      ];

      let asarBackendPath;
      for (const testPath of asarBackendPaths) {
        if (fs.existsSync(testPath)) {
          asarBackendPath = testPath;
          log.info(`Found ASAR backend at ${asarBackendPath}`);
          break;
        }
      }

      if (!asarBackendPath) {
        const error = new Error("Backend not found in any expected location");
        log.error(error);
        throw error;
      }

      try {
        extractFromAsar(asarBackendPath, tempPath);
        log.info(`Successfully extracted from ASAR to ${tempPath}`);
        backendPath = tempPath;
      } catch (error) {
        log.error(`Failed to extract from ASAR: ${error}`);
        throw error;
      }
    }
  }

  // Use path.join for constructing paths to scripts
  const dependencyScript = path.join(backendPath, "ensure_dependencies.py");
  const mainScript = path.join(backendPath, "main.py");

  return new Promise((resolve, reject) => {
    let totalPackages = 0;
    let installedPackages = 0;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    ensurePythonAndVenv(backendPath)
      .then(({ venvPython, hasNvidiaGpu }) => {
        log.info(`Venv Python: ${venvPython}`);
        log.info(`CUDA enabled: ${hasNvidiaGpu}`);

        // Define spawn options with proper typing
        const spawnOptions: SpawnOptions = {
          stdio: "pipe",
          env: {
            ...process.env,
            USE_CUDA: hasNvidiaGpu ? "1" : "0",
            FFMPEG_PATH: app.isPackaged
              ? path.join(
                  process.resourcesPath,
                  "ffmpeg" + (process.platform === "win32" ? ".exe" : "")
                )
              : typeof ffmpegStatic === "string"
              ? ffmpegStatic
              : "",
            JWT_SECRET: jwtSecret,
            IS_DEV: isDev() ? "1" : "0",
            SECRET_KEY: getSecret(),
          },
        };

        // Pass the GPU status and FFmpeg path to the dependency script
        const depProcess = spawn(venvPython, [dependencyScript], spawnOptions);

        if (!depProcess.stdout || !depProcess.stderr) {
          throw new Error("Failed to create process with stdio pipes");
        }

        log.info(`Dependency process started: ${depProcess.pid}`);

        depProcess.stdout.on("data", (data: Buffer) => {
          const message = data.toString().trim();
          log.info(`Dependency process output: ${message}`);

          if (message.startsWith("Total packages:")) {
            totalPackages = parseInt(
              message.split("|")[0].split(":")[1].trim()
            );
          } else {
            const [text, progress] = message.split("|");
            if (progress) {
              updateLoadingStatus(text, parseFloat(progress));
            } else {
              updateLoadingStatus(
                text,
                (installedPackages / totalPackages) * 35
              );
            }

            if (text.includes("Installing")) {
              installedPackages++;
            }
          }
        });

        depProcess.stderr.on("data", (data: Buffer) => {
          const errorMessage = data.toString().trim();
          // Don't treat these as errors since they're actually info messages from uvicorn
          if (errorMessage.includes("INFO:")) {
            log.info(`Python info: ${errorMessage}`);
          } else if (errorMessage.includes("Download complete.")) {
            log.error(`Dependency check error: ${errorMessage}`);
            updateLoadingStatus(`${errorMessage}`, -1);
          } else if (errorMessage.includes("Downloading")) {
            log.error(`Dependency check error: ${errorMessage}`);
            updateLoadingStatus(`${errorMessage}`, -1);
          } else {
            log.error(`Dependency check error: ${errorMessage}`);
            updateLoadingStatus(`Error: ${errorMessage}`, -1);
          }
        });

        depProcess.on("close", async (code: number | null) => {
          log.info(`Dependency process closed with code ${code}`);
          if (code === 0) {
            updateLoadingStatus("Starting application server...", 99);

            const startServer = async () => {
              // Create Python process with same options
              pythonProcess = spawn(venvPython, [mainScript], spawnOptions);

              if (
                !pythonProcess ||
                !pythonProcess.stdout ||
                !pythonProcess.stderr
              ) {
                reject(
                  new Error("Failed to create Python process with stdio pipes")
                );
                return;
              }

              log.info(`Python process spawned with PID: ${pythonProcess.pid}`);
              let serverStarting = true;

              pythonProcess.stdout.on("data", (data: Buffer) => {
                const message = data.toString().trim();
                log.info(`Python stdout: ${message}`);
                if (
                  message.includes("Application startup complete.") ||
                  message.includes("Uvicorn running on http://127.0.0.1:47372")
                ) {
                  serverStarting = false;
                  updateLoadingStatus("Application server ready!", 100);
                  resolve(true);
                }
              });

              pythonProcess.stderr.on("data", async (data: Buffer) => {
                const errorMessage = data.toString().trim();
                if (
                  errorMessage.includes("address already in use") ||
                  errorMessage.includes("[Errno 10048]")
                ) {
                  log.info(
                    "Port 47372 is in use, attempting to kill existing process"
                  );
                  await killProcessOnPort(47372);
                  // Wait for the port to be fully released
                  await new Promise((resolve) => setTimeout(resolve, 5000));
                  // Retry starting the server after a delay
                  if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    log.info(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);
                    setTimeout(() => startServer(), 2000);
                  } else {
                    reject(
                      new Error(
                        `Failed to start server after ${MAX_RETRIES} retries`
                      )
                    );
                  }
                  return;
                }

                // Don't treat uvicorn startup messages as errors
                if (errorMessage.includes("INFO")) {
                  log.info(`Python info: ${errorMessage}`);
                  if (
                    errorMessage.includes("Application startup complete.") ||
                    errorMessage.includes(
                      "Uvicorn running on http://127.0.0.1:47372"
                    )
                  ) {
                    serverStarting = false;
                    updateLoadingStatus("Application server ready!", 100);
                    resolve(true);
                  }
                } else {
                  log.error(`Python stderr: ${errorMessage}`);
                }
              });

              pythonProcess.on("error", (error: Error) => {
                const errorMessage = `Failed to start Python server: ${error.message}`;
                log.error(errorMessage);
                updateLoadingStatus(errorMessage, -1);
                if (!serverStarting) {
                  reject(error);
                }
              });

              pythonProcess.on("close", (code: number | null) => {
                if (code !== 0 && !serverStarting) {
                  const errorMessage = `Python server exited with code ${code}`;
                  log.error(errorMessage);
                  updateLoadingStatus(errorMessage, -1);
                  reject(new Error(errorMessage));
                }
              });
            };

            await startServer();
          } else {
            const errorMessage = `Dependency installation failed with code ${code}`;
            log.error(errorMessage);
            updateLoadingStatus(errorMessage, -1);
            reject(new Error(errorMessage));
          }
        });
      })
      .catch((error) => {
        log.error("Failed to start Python server", error);
        reject(error);
      });
  });
}

export function stopPythonServer() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}
