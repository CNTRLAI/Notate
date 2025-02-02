import { ipcMain } from "electron";
import { chatRequest } from "../llms/llms.js";
import { keyValidation } from "../llms/keyValidation.js";
import { BrowserWindow } from "electron";
const activeRequests = new Map();

export function setupChatHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle("keyValidation", async (event, { apiKey, inputProvider }) => {
    return keyValidation({ apiKey, inputProvider });
  });
  ipcMain.handle(
    "chatRequest",
    async (
      event,
      { messages, activeUser, conversationId, requestId, title, collectionId }
    ) => {
      const controller = new AbortController();
      activeRequests.set(requestId, controller);
      try {
        const result = await chatRequest(
          messages,
          activeUser,
          mainWindow,
          conversationId,
          title,
          collectionId,
          controller.signal
        );
        activeRequests.delete(requestId);
        return {
          messages: result.messages,
          id: result.id,
          title: result.title,
          collectionId: collectionId || undefined,
        };
      } catch (error) {
        activeRequests.delete(requestId);
        if (error instanceof Error && error.name === "AbortError") {
          return { error: "Request was aborted" };
        }
        throw error;
      }
    }
  );

  ipcMain.on("abortChatRequest", (event, requestId) => {
    const controller = activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      activeRequests.delete(requestId);
    }
  });
}
