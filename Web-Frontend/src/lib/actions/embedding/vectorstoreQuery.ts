import { getToken } from "@/src/lib/authentication/token.js";
import db from "@/src/lib/db.js";

export async function vectorstoreQuery(payload: {
  query: string;
  userId: number;
  userName: string;
  collectionId: number;
  collectionName: string;
}) {
  let apiKey = null;
  try {
    apiKey = db.api_keys.findFirst({
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
      where: {
        id: payload.collectionId,
      },
    });
    if (collection?.is_local) {
      isLocal = true;
      localEmbeddingModel = collection?.local_embedding_model;
    }
  }
  const token = await getToken({ userId: payload.userId.toString() });
  const response = await fetch(`http://localhost:47372/vector-query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      query: payload.query,
      collection: payload.collectionId,
      collection_name: payload.collectionName,
      user: payload.userId,
      api_key: apiKey,
      top_k: 5,
      is_local: isLocal,
      local_embedding_model: localEmbeddingModel,
    }),
  });

  const data = await response.json();
  return data;
}
