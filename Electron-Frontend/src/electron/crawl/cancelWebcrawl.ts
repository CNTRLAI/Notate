import { getToken } from "../authentication/token.js";

export async function cancelWebcrawl(payload: {
  userId: number;
}): Promise<Response> {
  try {
    const token = await getToken({ userId: payload.userId.toString() });
    return await fetch("http://localhost:47372/cancel-crawl", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error canceling webcrawl:", error);
    throw error;
  }
}
