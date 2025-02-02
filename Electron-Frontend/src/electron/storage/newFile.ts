import fs from "fs";
import path from "path";
import { app, BrowserWindow } from "electron";
import db from "../db.js";
import { getToken } from "../authentication/token.js";

interface PythonProgressData {
  type: string;
  message: string;
  chunk?: number;
  totalChunks?: number;
  percent_complete?: string;
}

interface ProgressData {
  status: string;
  data: {
    message: string;
    chunk?: number;
    total_chunks?: number;
    percent_complete?: string;
  };
}

export async function addFileToCollection(
  userId: number,
  userName: string,
  collectionId: number,
  collectionName: string,
  fileName: string,
  fileContent: string,
  signal?: AbortSignal
) {
  try {
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];

    const sendProgress = (data: string) => {
      try {
        if (typeof data === "string") {
          const lines = data.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              const jsonStr = line.replace(/^data:\s*/, "").trim();
              if (jsonStr) {
                try {
                  // Convert Python-style single quotes to double quotes for JSON parsing
                  const formattedJson = jsonStr
                    .replace(/'/g, '"')
                    // Handle nested quotes in message strings
                    .replace(/"([^"]*)'([^']*)'([^"]*)"/, '"$1\\"$2\\"$3"');
                  const parsedData = JSON.parse(
                    formattedJson
                  ) as PythonProgressData;

                  const progressData: ProgressData = {
                    status: parsedData.type || "progress",
                    data: {
                      message: parsedData.message,
                      chunk: parsedData.chunk,
                      total_chunks: parsedData.totalChunks,
                      percent_complete: parsedData.percent_complete,
                    },
                  };

                  mainWindow?.webContents.send("ingest-progress", progressData);
                } catch (parseError) {
                  console.error("[NEW_FILE] JSON parse error:", parseError);
                  console.error("[NEW_FILE] Failed to parse data:", jsonStr);
                }
              }
            }
          }
        } else {
          mainWindow?.webContents.send("ingest-progress", data);
        }
      } catch (error) {
        console.error("[NEW_FILE] Error in sendProgress:", error);
        console.error("[NEW_FILE] Problematic data:", data);
        mainWindow?.webContents.send("ingest-progress", {
          status: "error",
          data: {
            message: "Error processing progress update",
          },
        });
      }
    };

    const collectionPath = path.join(
      process.platform === "linux" ? app.getPath("userData") : app.getAppPath(),
      "..",
      "FileCollections",
      userId.toString() + "_" + userName,
      collectionId.toString() + "_" + collectionName
    );

    if (!fs.existsSync(collectionPath)) {
      fs.mkdirSync(collectionPath, { recursive: true });
    }

    const filePath = path.join(collectionPath, fileName);
    fs.writeFileSync(filePath, fileContent);
    let apiKey = null;
    try {
      apiKey = db.getApiKey(userId, "openai");
    } catch {
      apiKey = null;
    }
    let isLocal = false;
    let localEmbeddingModel = "";
    if (!apiKey) {
      isLocal = true;
      localEmbeddingModel =
        "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5";
    }

    if (collectionId) {
      if (db.isCollectionLocal(collectionId)) {
        isLocal = true;
        localEmbeddingModel = db.getCollectionLocalEmbeddingModel(collectionId);
      }
    }
    db.addFileToCollection(userId, collectionId, fileName);

    sendProgress(
      JSON.stringify({
        type: "progress",
        message: "Starting file processing...",
        chunk: 1,
        totalChunks: 2,
        percent_complete: "50%",
      })
    );

    const controller = new AbortController();

    if (signal) {
      signal.addEventListener("abort", () => {
        controller.abort();
      });
    }

    const token = await getToken({ userId: userId.toString() });
    const response = await fetch("http://localhost:47372/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        file_path: filePath,
        api_key: apiKey,
        user: userId,
        collection: collectionId,
        collection_name: collectionName,
        is_local: isLocal,
        local_embedding_model: localEmbeddingModel,
      }),
      signal: controller.signal,
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get response reader");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (signal?.aborted || controller.signal.aborted) {
        reader.cancel();
        sendProgress(
          JSON.stringify({
            type: "error",
            message: "Operation cancelled",
          })
        );
        return { success: false, error: "Operation cancelled" };
      }

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || "";

      for (const message of messages) {
        if (message.trim()) {
          sendProgress(message);
        }
      }
    }

    if (buffer.trim()) {
      sendProgress(buffer);
    }

    return { success: true, filePath };
  } catch (error) {
    console.error("[NEW_FILE] Error adding file to collection:", error);
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];

    if (error instanceof Error && error.name === "AbortError") {
      mainWindow?.webContents.send("ingest-progress", {
        status: "error",
        data: {
          message: "Operation cancelled",
        },
      });
      return { success: false, error: "Operation cancelled" };
    }

    mainWindow?.webContents.send("ingest-progress", {
      status: "error",
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return { success: false, error: "Failed to add file to collection" };
  }
}
