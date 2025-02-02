import db from "../db.js";
import { ipcMainHandle, ipcMainDatabaseHandle } from "../util.js";
import { getDevApiKey } from "../authentication/devApi.js";
export function setupDbHandlers() {
  ipcMainDatabaseHandle("getUserSettings", async (payload) => {
    try {
      const userSettings = await db.getUserSettings(payload.userId);
      return { userId: payload.userId, ...userSettings };
    } catch (error) {
      console.error("Error getting user settings:", error);
      throw error;
    }
  });
  ipcMainHandle("addUser", async (_, { name }) => {
    try {
      const result = await db.addUser(name as string);
      if (result.error) {
        return { name: result.name, error: result.error };
      }
      return { name: result.name };
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("addUserConversation", async (payload) => {
    try {
      let title: string | undefined;
      const conversation = await db.addUserConversation(
        payload.userId,
        title ?? "New Conversation"
      );
      return {
        userId: conversation.userId,
        id: Number(conversation.id),
        input: payload.input,
        title: conversation.title ?? "New Conversation",
      };
    } catch (error) {
      console.error("Error adding user conversation:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("getUserCollections", async (payload) => {
    try {
      return {
        userId: payload.userId,
        collections: await db.getUserCollections(payload.userId),
      };
    } catch (error) {
      console.error("Error getting user collections:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("updateUserSettings", async (payload) => {
    try {
      await db.updateUserSettings(payload);
      return payload;
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("getUserApiKeys", async (payload) => {
    try {
      return {
        userId: payload.userId,
        apiKeys: await db.getUserApiKeys(payload.userId),
      };
    } catch (error) {
      console.error("Error getting user api keys:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("getUserPrompts", async (payload) => {
    try {
      return {
        userId: payload.userId,
        prompts: await db.getUserPrompts(payload.userId),
      };
    } catch (error) {
      console.error("Error getting user prompts:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("getUsers", async () => {
    try {
      const users = await db.getUsers();
      return {
        users: users.map((user: { name: string; id: number }) => ({
          name: user.name,
          id: user.id,
        })),
      };
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("createCollection", async (payload) => {
    try {
      const createdCollection = await db.createCollection(
        payload.userId,
        payload.name,
        payload.description,
        payload.type,
        payload.isLocal ? 1 : 0,
        payload.localEmbeddingModel
      );

      return {
        userId: payload.userId,
        name: payload.name,
        description: payload.description,
        type: payload.type,
        id: createdCollection.id,
        isLocal: Boolean(payload.isLocal),
        localEmbeddingModel: payload.localEmbeddingModel,
      };
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("deleteConversation", async (payload) => {
    try {
      return {
        userId: payload.userId,
        conversationId: payload.conversationId,
        result: await db.deleteUserConversation(
          payload.userId,
          payload.conversationId
        ),
      };
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("getConversationMessagesWithData", async (payload) => {
    try {
      return {
        userId: payload.userId,
        conversationId: payload.conversationId,
        messages: await db.getConversationMessagesWithData(
          payload.userId,
          payload.conversationId
        ),
      };
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("getConversationMessages", async (payload) => {
    try {
      return {
        userId: payload.userId,
        conversationId: payload.conversationId,
        messages: await db.getConversationMessages(
          payload.userId,
          payload.conversationId
        ),
      };
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("addUserPrompt", async (payload) => {
    try {
      const promptAdded = await db.addUserPrompt(
        payload.userId,
        payload.name,
        payload.prompt
      );
      return {
        userId: promptAdded.userId,
        name: promptAdded.name,
        prompt: promptAdded.prompt,
        id: promptAdded.id,
      };
    } catch (error) {
      console.error("Error adding user prompt:", error);
      throw error;
    }
  });

  ipcMainDatabaseHandle("updateUserPrompt", async (payload) => {
    try {
      return {
        userId: payload.userId,
        id: payload.id,
        name: payload.name,
        prompt: payload.prompt,
        result: await db.updateUserPrompt(
          payload.userId,
          payload.id,
          payload.name,
          payload.prompt
        ),
      };
    } catch (error) {
      console.error("Error updating user prompt:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("addAPIKey", async (payload) => {
    try {
      return {
        userId: payload.userId,
        key: payload.key,
        provider: payload.provider,
        result: await db.addAPIKey(
          payload.userId,
          payload.key,
          payload.provider
        ),
      };
    } catch (error) {
      console.error("Error adding API key:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("getUserConversations", async (payload) => {
    try {
      return {
        userId: payload.userId,
        conversations: await db.getUserConversations(payload.userId),
      };
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("addDevAPIKey", async (payload) => {
    try {
      const newApiKey = await getDevApiKey({
        userId: payload.userId.toString(),
        expiration: payload.expiration,
      });
      const result = await db.addDevAPIKey(
        payload.userId,
        payload.name,
        newApiKey,
        payload.expiration ?? null
      );
      return {
        userId: payload.userId,
        name: payload.name,
        key: newApiKey,
        expiration: payload.expiration,
        id: result.lastInsertRowid,
      } as Keys;
    } catch (error) {
      console.error("Error adding dev API key:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("getDevAPIKeys", async (payload) => {
    try {
      return {
        userId: payload.userId,
        keys: await db.getDevAPIKeys(payload.userId),
      };
    } catch (error) {
      console.error("Error getting dev API keys:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("deleteDevAPIKey", async (payload) => {
    try {
      return {
        userId: payload.userId,
        id: payload.id,
        result: await db.deleteDevAPIKey(payload.userId, payload.id),
      };
    } catch (error) {
      console.error("Error deleting dev API key:", error);
      throw error;
    }
  });

  // Tools Section

  ipcMainDatabaseHandle("getUserTools", async (payload) => {
    try {
      return {
        userId: payload.userId,
        tools: await db.getUserTools(payload.userId),
      };
    } catch (error) {
      console.error("Error getting tools:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("addUserTool", async (payload) => {
    try {
      return {
        userId: payload.userId,
        toolId: payload.toolId,
        enabled: payload.enabled,
        docked: payload.docked,
        result: await db.addUserTool(
          payload.userId,
          payload.toolId,
          payload.enabled,
          payload.docked
        ),
      };
    } catch (error) {
      console.error("Error adding user tool:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("removeUserTool", async (payload) => {
    try {
      return {
        userId: payload.userId,
        toolId: payload.toolId,
        result: await db.removeUserTool(payload.userId, payload.toolId),
      };
    } catch (error) {
      console.error("Error removing user tool:", error);
      throw error;
    }
  });
  ipcMainDatabaseHandle("updateUserTool", async (payload) => {
    console.log("payload", payload);
    try {
      return {
        userId: payload.userId,
        toolId: payload.toolId,
        enabled: payload.enabled,
        docked: payload.docked,
        result: await db.updateUserTool(
          payload.userId,
          payload.toolId,
          payload.enabled,
          payload.docked
        ),
      };
    } catch (error) {
      console.error("Error updating user tool:", error);
      throw error;
    }
  });
  ipcMainHandle("getTools", async () => {
    try {
      return {
        tools: await db.getTools(),
      };
    } catch (error) {
      console.error("Error getting tools:", error);
      throw error;
    }
  });
}
