import db from "../db.js";

import { getToken } from "../authentication/token.js";

export async function deleteCollection(
  collectionId: number,
  collectionName: string,
  userId: number
) {
  const token = await getToken({ userId: userId.toString() });
  let apiKey = null;
  let isLocal = false;
  try {
    apiKey = await db.getApiKey(userId, "openai");
  } catch {
    apiKey = null;
  }
  if (!apiKey) {
    isLocal = true;
  }

  const response = await fetch("http://127.0.0.1:47372/delete-collection", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      collection_id: Number(collectionId),
      collection_name: collectionName,
      is_local: isLocal,
      api_key: apiKey,
    }),
  });
  if (response.ok) {
    return true;
  }
  return false;
}
