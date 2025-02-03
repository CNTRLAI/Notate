"use server";

import db from "@/src/lib/db";
import { getToken } from "@/src/lib/authentication/token";
import { ProgressData, PythonProgressData } from "@/src/types/progress";

export async function youtubeIngest(payload: {
  url: string;
  userId: number;
  userName: string;
  collectionId: number;
  collectionName: string;
  onProgress?: (data: ProgressData) => void;
}): Promise<{
  userId: number;
  conversationId: number;
  error?: string;
}> {
  try {
    await db.collections.update({
      where: { id: payload.collectionId },
      data: {
        files: payload.url,
      },
    });

    const sendProgress = (data: string | ProgressData) => {
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
                    status:
                      (parsedData.type as "progress" | "error" | "success") ||
                      "progress",
                    data: {
                      message: parsedData.message,
                      chunk: parsedData.chunk,
                      total_chunks: parsedData.totalChunks,
                      percent_complete: parsedData.percent_complete,
                    },
                  };

                  payload.onProgress?.(progressData);
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
          payload.onProgress?.(data);
        }
      } catch (error) {
        console.error("[YOUTUBE_INGEST] Error in sendProgress:", error);
        console.error("[YOUTUBE_INGEST] Problematic data:", data);
        payload.onProgress?.({
          status: "error",
          data: {
            message: "Error processing progress update",
          },
        });
      }
    };

    let apiKey = null;
    try {
      apiKey = await db.api_keys.findFirst({
        where: {
          user_id: payload.userId,
          provider: "openai",
        },
      });
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
      const collection = await db.collections.findUnique({
        where: { id: payload.collectionId },
      });
      if (collection?.is_local) {
        isLocal = true;
        localEmbeddingModel =
          collection.local_embedding_model || localEmbeddingModel;
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
    payload.onProgress?.({
      status: "error",
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return {
      userId: payload.userId,
      conversationId: payload.collectionId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
