import { getToken } from "../authentication/token.js";
import db from "../db.js";

export async function vectorstoreQuery(payload: {
  query: string;
  userId: number;
  userName: string;
  collectionId: number;
  collectionName: string;
}) {
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
