"use server";

import fs from "fs";
import path from "path";
import db from "@/src/lib/db"; 
import { getToken } from "@/src/lib/authentication/token";
import { ProgressData, PythonProgressData } from "@/src/types/progress";

export async function addFileToCollection(
  userId: number,
  userName: string,
  collectionId: number,
  collectionName: string,
  fileName: string,
  fileContent: string,
  onProgress?: (data: ProgressData) => void,
  signal?: AbortSignal
) {
  try {
    const sendProgress = (data: string | ProgressData) => {
      if (!onProgress) return;

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

                  onProgress(progressData);
                } catch (parseError) {
                  console.error("[NEW_FILE] JSON parse error:", parseError);
                  console.error("[NEW_FILE] Failed to parse data:", jsonStr);
                }
              }
            }
          }
        } else {
          onProgress(data);
        }
      } catch (error) {
        console.error("[NEW_FILE] Error in sendProgress:", error);
        console.error("[NEW_FILE] Problematic data:", data);
        onProgress({
          status: "error",
          data: {
            message: "Error processing progress update",
          },
        });
      }
    };

    const collectionPath = path.join(
      process.cwd(),
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
      const apiKeyRecord = await db.api_keys.findFirst({
        where: {
          user_id: userId,
          provider: "openai",
        },
      });
      apiKey = apiKeyRecord?.key || null;
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
      const collection = await db.collections.findUnique({
        where: { id: collectionId },
      });
      if (collection?.is_local) {
        isLocal = true;
        localEmbeddingModel =
          collection.local_embedding_model || localEmbeddingModel;
      }
    }

    // Add file to collection in database
    await db.collections.update({
      where: { id: collectionId },
      data: {
        files: fileName,
      },
    });

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

    if (error instanceof Error && error.name === "AbortError") {
      onProgress?.({
        status: "error",
        data: {
          message: "Operation cancelled",
        },
      });
      return { success: false, error: "Operation cancelled" };
    }

    onProgress?.({
      status: "error",
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return { success: false, error: "Failed to add file to collection" };
  }
}
