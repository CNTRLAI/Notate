import { getToken } from "@/src/lib/authentication/token";

export async function unloadModel(payload: {
  model_location: string;
  model_name: string;
  model_type?: string;
  user_id: number;
}) {
  try {
    const token = await getToken({ userId: payload.user_id.toString() });
    const response = await fetch(`http://localhost:47372/unload-model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        model_location: payload.model_location,
        model_name: payload.model_name,
        model_type: payload.model_type,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error unloading model:", error);
    throw error;
  }
}
