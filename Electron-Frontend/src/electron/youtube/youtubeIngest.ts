import { BrowserWindow } from "electron";
import db from "../db.js";
import { getToken } from "../authentication/token.js";

interface PythonProgressData {
  type: string;
  message: string;
  chunk: number;
  totalChunks: number;
  percent_complete: string;
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

export async function youtubeIngest(payload: {
  url: string;
  userId: number;
  userName: string;
  collectionId: number;
  collectionName: string;
}) {
  try {
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];
    db.addFileToCollection(payload.userId, payload.collectionId, payload.url);

    const sendProgress = (data: string) => {
      try {
        if (typeof data === "string") {
          const lines = data.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              const jsonStr = line.replace(/^data:\s*/, "").trim();
              if (jsonStr) {
                try {
                  const formattedJson = jsonStr
                    .replace(/'/g, '"')
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
                  console.error(
                    "[YOUTUBE_INGEST] JSON parse error:",
                    parseError
                  );
                  console.error(
                    "[YOUTUBE_INGEST] Failed to parse data:",
                    jsonStr
                  );
                }
              }
            }
          }
        } else {
          mainWindow?.webContents.send("ingest-progress", data);
        }
      } catch (error) {
        console.error("[YOUTUBE_INGEST] Error in sendProgress:", error);
        console.error("[YOUTUBE_INGEST] Problematic data:", data);
        mainWindow?.webContents.send("ingest-progress", {
          status: "error",
          data: {
            message: "Error processing progress update",
          },
        });
      }
    };

    let apiKey = null;
    try {
      apiKey = db.getApiKey(payload.userId, "openai");
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
    if (payload.collectionId) {
      if (db.isCollectionLocal(payload.collectionId)) {
        isLocal = true;
        localEmbeddingModel = db.getCollectionLocalEmbeddingModel(
          payload.collectionId
        );
      }
    }
    const token = await getToken({ userId: payload.userId.toString() });
    const response = await fetch(`http://localhost:47372/youtube-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: payload.url,
        user_id: payload.userId,
        collection_id: payload.collectionId,
        collection_name: payload.collectionName,
        username: payload.userName,
        api_key: apiKey,
        is_local: isLocal,
        local_embedding_model: localEmbeddingModel,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get response reader");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

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

    return {
      userId: payload.userId,
      conversationId: payload.collectionId,
    };
  } catch (error) {
    console.error("[YOUTUBE_INGEST] Error in YouTube ingest:", error);
    const windows = BrowserWindow.getAllWindows();
    const mainWindow = windows[0];

    mainWindow?.webContents.send("ingest-progress", {
      status: "error",
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
