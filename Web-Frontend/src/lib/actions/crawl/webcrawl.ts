import { getToken } from "@/src/lib/authentication/token.js";
import db from "@/src/lib/db.js";
import { ProgressData } from "@/src/types/progress";

export async function webcrawl(payload: {
  base_url: string;
  user_id: number;
  user_name: string;
  collection_id: number;
  collection_name: string;
  max_workers: number;
}) {
  const sendProgress = (data: string | ProgressData) => {
    try {
      if (typeof data === "string") {
        const jsonStr = data.replace(/^data:\s*/, "").trim();
        if (jsonStr) {
          try {
            const parsedData = JSON.parse(jsonStr) as ProgressData;
            console.log("parsedData", parsedData);
          } catch (parseError) {
            console.error("[WEBCRAWL] JSON parse error:", parseError);
            console.error("[WEBCRAWL] Failed to parse data:", jsonStr);
          }
        }
      } else {
        console.log("data", data);
      }
    } catch (error) {
      console.error("[WEBCRAWL] Error in sendProgress:", error);
      console.error("[WEBCRAWL] Problematic data:", data);
    }
  };

  let apiKey = null;
  try {
    apiKey = db.api_keys.findFirst({
      where: {
        user_id: payload.user_id,
        provider: "openai",
      },
    });
  } catch (error) {
    console.error(
      "[WEBCRAWL] No OpenAI API key found, using local embeddings",
      error
    );
    apiKey = null;
  }

  let isLocal = false;
  let localEmbeddingModel = "";
  if (!apiKey) {
    isLocal = true;
    localEmbeddingModel =
      "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5";
  }
  if (payload.collection_id) {
    const collection = await db.collections.findUnique({
      where: {
        id: payload.collection_id,
      },
    });
    if (collection?.is_local) {
      isLocal = true;
      localEmbeddingModel = collection.local_embedding_model;
    }
  }

  try {
    const token = await getToken({ userId: payload.user_id.toString() });
    db.collections.update({
      where: {
        id: payload.collection_id,
        user_id: payload.user_id,
      },
      data: {
        files: payload.base_url,
      },
    });
    const response = await fetch("http://localhost:47372/webcrawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        base_url: payload.base_url,
        max_workers: payload.max_workers,
        collection_name: payload.collection_name,
        collection_id: payload.collection_id,
        user_id: payload.user_id,
        user_name: payload.user_name,
        api_key: apiKey,
        is_local: isLocal,
        local_embedding_model: isLocal ? localEmbeddingModel : undefined,
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
      if (done) {
        break;
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

    return {
      userId: payload.user_id,
      conversationId: payload.collection_id,
    };
  } catch (error) {
    console.error("[WEBCRAWL] Critical error in webcrawl:", error);
    sendProgress({
      status: "error",
      data: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
