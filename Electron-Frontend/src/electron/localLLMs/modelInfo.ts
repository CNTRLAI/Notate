import { getToken } from "../authentication/token.js";

export async function modelInfo(payload: {
  model_location: string;
  model_name: string;
  model_type?: string;
  user_id: number;
}) {
  try {
    const token = await getToken({ userId: payload.user_id.toString() });
    const response = await fetch(`http://localhost:47372/model-info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting model info:", error);
    throw error;
  }
}
