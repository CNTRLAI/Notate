import { ipcMainDatabaseHandle } from "../util.js";

import { getDirModels } from "../localLLMs/getDirModels.js";
import { unloadModel } from "../localLLMs/unloadModel.js";
import { loadModel } from "../localLLMs/loadModel.js";
import { modelInfo } from "../localLLMs/modelInfo.js";
import * as fs from "fs";
import * as path from "path";
import { BrowserWindow, app } from "electron";
import { platform } from "os";

let currentDownloadController: AbortController | null = null;

function getModelsPath() {
  const home = app.getPath("home");
  if (platform() === "darwin") {
    return path.join(
      home,
      "Library/Application Support/Notate/embeddings_models"
    );
  } else if (platform() === "linux") {
    return path.join(home, ".local/share/Notate/embeddings_models");
  } else {
    return path.join(home, ".notate/embeddings_models");
  }
}

async function downloadModel(payload: {
  modelId: string;
  dirPath: string;
  hfToken?: string;
}) {
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows[0];
  const sendProgress = (data: DownloadProgress) => {
    mainWindow?.webContents.send("download-model-progress", data);
  };

  // Calculate download speed
  const calculateSpeed = (bytes: number, timeInMs: number) => {
    const bytesPerSecond = (bytes / timeInMs) * 1000;
    if (bytesPerSecond > 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    } else if (bytesPerSecond > 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    }
    return `${bytesPerSecond.toFixed(2)} B/s`;
  };

  try {
    // Check if directory exists and has files
    if (fs.existsSync(payload.dirPath)) {
      const existingFiles = fs.readdirSync(payload.dirPath);
      if (existingFiles.length > 0) {
        // Check for common model files
        const hasModelFiles = existingFiles.some(
          (file) =>
            file.endsWith(".gguf") ||
            file.endsWith(".bin") ||
            file.endsWith(".safetensors") ||
            file === "config.json" ||
            file === "tokenizer.json"
        );

        if (hasModelFiles) {
          sendProgress({
            type: "progress",
            data: {
              message: "Model already exists",
              totalProgress: 100,
              currentStep: "complete",
            },
          });
          return payload;
        }
      }
    }

    // Create directory if it doesn't exist
    fs.mkdirSync(payload.dirPath, { recursive: true });

    // Get repository contents from Hugging Face
    const headers: { [key: string]: string } = {
      Accept: "application/json",
    };
    if (payload.hfToken) {
      headers["Authorization"] = `Bearer ${payload.hfToken}`;
    }

    sendProgress({
      type: "progress",
      data: {
        message: "Fetching model information...",
        totalProgress: 0,
        currentStep: "init",
      },
    });

    currentDownloadController = new AbortController();
    const signal = currentDownloadController.signal;

    // Extract the model name and path
    const modelPath = payload.modelId.split('/');
    const repoOwner = modelPath[0];
    const repoName = modelPath[1];
    const subPath = modelPath.slice(2).join('/');

    // Construct the API URL with the correct path
    const apiUrl = `https://huggingface.co/api/models/${repoOwner}/${repoName}/tree/main/${subPath}`;
    const response = await fetch(apiUrl, { headers, signal });

    if (!response.ok) {
      throw new Error(`Failed to fetch model info: ${response.statusText}`);
    }

    const files = (await response.json()) as { path: string; size: number }[];

    // Filter out zero-size files and sort by size (largest first)
    const downloadableFiles = files
      .filter((file) => file.size > 0)
      .sort((a, b) => b.size - a.size);

    // Calculate total size
    const totalSize = downloadableFiles.reduce(
      (acc, file) => acc + file.size,
      0
    );
    let downloadedSize = 0;

    // Format size to human readable
    const formatSize = (bytes: number) => {
      const units = ["B", "KB", "MB", "GB"];
      let size = bytes;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    // Keep track of failed files
    const failedFiles: string[] = [];

    // Download each file
    for (const [index, file] of downloadableFiles.entries()) {
      const fileName = file.path;
      const downloadUrl = `https://huggingface.co/${repoOwner}/${repoName}/resolve/main/${fileName}`;
      const filePath = path.join(payload.dirPath, path.basename(fileName));

      // Create subdirectories if needed
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      sendProgress({
        type: "progress",
        data: {
          message: `Downloading file ${index + 1} of ${
            downloadableFiles.length
          }`,
          fileName,
          fileNumber: index + 1,
          totalFiles: downloadableFiles.length,
          fileProgress: 0,
          totalProgress: Math.round((downloadedSize / totalSize) * 100),
          currentSize: formatSize(downloadedSize),
          totalSize: formatSize(totalSize),
          currentStep: "downloading",
          speed: "Starting...",
        },
      });

      try {
        const fileResponse = await fetch(downloadUrl, { headers, signal });

        if (!fileResponse.ok) {
          console.warn(
            `Failed to download ${fileName}: ${fileResponse.statusText}`
          );
          failedFiles.push(fileName);
          continue;
        }

        if (!fileResponse.body) {
          console.warn(`No data received for ${fileName}`);
          failedFiles.push(fileName);
          continue;
        }

        // Stream the file to disk with progress tracking
        const fileStream = fs.createWriteStream(filePath);
        const reader = fileResponse.body.getReader();
        let receivedLength = 0;
        let lastUpdate = Date.now();
        let lastBytes = 0;

        while (true) {
          try {
            const { done, value } = await reader.read();

            // Add check for abort signal
            if (signal.aborted) {
              reader.cancel();
              fileStream.destroy();
              throw new Error("Download cancelled");
            }

            if (done) break;

            receivedLength += value.length;
            downloadedSize += value.length;
            fileStream.write(value);

            // Calculate speed every 500ms
            const now = Date.now();
            const timeDiff = now - lastUpdate;
            if (timeDiff >= 500) {
              const bytesDiff = receivedLength - lastBytes;
              const speed = calculateSpeed(bytesDiff, timeDiff);
              lastUpdate = now;
              lastBytes = receivedLength;

              // Update progress
              const totalProgress = Math.round(
                (downloadedSize / totalSize) * 100
              );
              const fileProgress = Math.round(
                (receivedLength / file.size) * 100
              );

              sendProgress({
                type: "progress",
                data: {
                  message: `Downloading file ${index + 1} of ${
                    downloadableFiles.length
                  }`,
                  fileName,
                  fileNumber: index + 1,
                  totalFiles: downloadableFiles.length,
                  fileProgress,
                  totalProgress,
                  currentSize: formatSize(downloadedSize),
                  totalSize: formatSize(totalSize),
                  currentStep: "downloading",
                  speed,
                },
              });
            }
          } catch (error) {
            reader.cancel();
            fileStream.destroy();
            throw error;
          }
        }

        fileStream.end();
      } catch (error) {
        console.warn(`Error downloading ${fileName}:`, error);
        failedFiles.push(fileName);
        continue;
      }
    }

    // If all files failed, throw error and remove the directory
    if (failedFiles.length === downloadableFiles.length) {
      fs.rmSync(payload.dirPath, { recursive: true, force: true });
      throw new Error("Failed to download any files from the model");
    }

    // If some files failed but not all, show warning
    if (failedFiles.length > 0) {
      console.warn("Some files failed to download:", failedFiles);
      sendProgress({
        type: "progress",
        data: {
          message: `Download completed with ${failedFiles.length} skipped files`,
          totalProgress: 100,
          currentStep: "complete",
          currentSize: formatSize(downloadedSize),
          totalSize: formatSize(totalSize),
        },
      });
    } else {
      sendProgress({
        type: "progress",
        data: {
          message: "Download completed successfully",
          totalProgress: 100,
          currentStep: "complete",
          currentSize: formatSize(totalSize),
          totalSize: formatSize(totalSize),
        },
      });
    }

    return payload;
  } catch (error) {
    console.error("Error downloading model:", error);
    // Clean up partially downloaded files on error
    if (fs.existsSync(payload.dirPath)) {
      fs.rmSync(payload.dirPath, { recursive: true, force: true });
    }

    // Add specific handling for cancellation
    if (error instanceof Error && error.message === "Download cancelled") {
      throw new Error("Download cancelled by user");
    }
    throw error;
  } finally {
    currentDownloadController = null;
  }
}

export function setupLocalModelHandlers() {
  ipcMainDatabaseHandle("getModelsPath", async () => {
    const modelsPath = getModelsPath();
    fs.mkdirSync(modelsPath, { recursive: true });
    return modelsPath;
  });

  ipcMainDatabaseHandle("getEmbeddingsModels", async () => {
    const models = await getDirModels({ dirPath: getModelsPath() });
    return { models };
  });

  ipcMainDatabaseHandle("getDirModels", async (payload) => {
    const models = await getDirModels(payload);
    return { dirPath: payload.dirPath, models };
  });

  ipcMainDatabaseHandle("loadModel", async (payload) => {
    try {
      const result = await loadModel(payload);
      return result;
    } catch (error) {
      console.error("Error loading model:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("unloadModel", async (payload) => {
    try {
      const result = await unloadModel(payload);
      return result;
    } catch (error) {
      console.error("Error unloading model:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("downloadModel", async (payload) => {
    try {
      const result = await downloadModel(payload);
      return result;
    } catch (error) {
      console.error("Error downloading model:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("cancelDownload", async () => {
    if (currentDownloadController) {
      currentDownloadController.abort();
      currentDownloadController = null;
      return { success: true };
    }
    return { success: false };
  });

  ipcMainDatabaseHandle("getModelInfo", async (payload) => {
    try {
      const result = await modelInfo(payload);
      return result;
    } catch (error) {
      console.error("Error getting model info:", error);
      throw error;
    }
  });
}
