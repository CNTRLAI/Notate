import { ipcMainDatabaseHandle } from "../util.js";
import db from "../db.js";

export async function setupAzureOpenAI() {
  ipcMainDatabaseHandle("addAzureOpenAIModel", async (payload) => {
    const id = await db.addAzureOpenAIModel(
      payload.userId,
      payload.name,
      payload.model,
      payload.endpoint,
      payload.api_key
    );
    return {
      id,
      userId: payload.userId,
      name: payload.name,
      model: payload.model,
      endpoint: payload.endpoint,
      api_key: payload.api_key
    };
  });

  ipcMainDatabaseHandle("deleteAzureOpenAIModel", async (payload) => {
    await db.deleteAzureOpenAIModel(payload.userId, payload.id);
    return { userId: payload.userId, id: payload.id };
  });

  ipcMainDatabaseHandle("getAzureOpenAIModels", async (payload) => {
    const models = await db.getAzureOpenAIModels(payload.userId);
    return { userId: payload.userId, models };
  });

  ipcMainDatabaseHandle("getAzureOpenAIModel", async (payload) => {
    const model = await db.getAzureOpenAIModel(payload.userId, payload.id);
    return { ...model, userId: payload.userId, id: payload.id };
  });
}
