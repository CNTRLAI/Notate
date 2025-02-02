import { getToken } from "../authentication/token.js";

export async function cancelEmbed(payload: {
  userId: number;
}): Promise<Response> {
  try {
    const token = await getToken({ userId: payload.userId.toString() });
    return await fetch("http://localhost:47372/cancel-embed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error canceling embed:", error);
    throw error;
  }
}
