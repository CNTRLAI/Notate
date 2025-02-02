import { ipcMainDatabaseHandle } from "../util.js";
import db from "../db.js";

export async function setupCustomApiHandlers() {
  ipcMainDatabaseHandle("addCustomAPI", async (payload) => {
    const apiId = await db.addCustomAPI(
      payload.userId,
      payload.name,
      payload.endpoint,
      payload.api_key,
      payload.model
    );
    return {
      userId: payload.userId,
      name: payload.name,
      endpoint: payload.endpoint,
      api_key: payload.api_key,
      model: payload.model,
      id: apiId,
    };
  });
  ipcMainDatabaseHandle("deleteCustomAPI", async (payload) => {
    await db.deleteCustomAPI(payload.userId, payload.id);
    return payload;
  });
  ipcMainDatabaseHandle("getCustomAPI", async (payload) => {
    const apis = await db.getCustomAPI(payload.userId);
    return { userId: payload.userId, api: apis };
  });
  ipcMainDatabaseHandle("getCustomAPIs", async (payload) => {
    const apis = await db.getCustomAPIs(payload.userId);
    return { userId: payload.userId, api: apis };
  });
}
