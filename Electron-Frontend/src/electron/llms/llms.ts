import db from "../db.js";
import log from "electron-log";
import os from "os";
import { BrowserWindow } from "electron";
import { ifCollection } from "./llmHelpers/collectionData.js";
import { ifNewConversation } from "./llmHelpers/ifNewConvo.js";
import { getUserPrompt } from "./llmHelpers/getUserPrompt.js";
import { providersMap } from "./llmHelpers/providersMap.js";
import { addUserMessage } from "./llmHelpers/addUserMessage.js";
import { addAssistantMessage } from "./llmHelpers/addAssistantMessage.js";

export async function chatRequest(
  messages: Message[],
  activeUser: User,
  mainWindow: BrowserWindow,
  conversationId?: number,
  title?: string,
  collectionId?: bigint | number,
  signal?: AbortSignal
): Promise<ChatRequestResult> {
  const platform = os.platform();

  try {
    const userSettings = await db.getUserSettings(activeUser.id);
    let data;
    if ((!title && conversationId) || (title === undefined && conversationId)) {
      title = await db.getUserConversationTitle(conversationId, activeUser.id);
    }

    if (!conversationId) {
      const { cId, title: newTitle } = await ifNewConversation(
        messages,
        activeUser
      );
      conversationId = cId;
      title = newTitle;
    }

    if (collectionId) {
      const { collectionData } = await ifCollection(
        messages,
        activeUser,
        Number(collectionId),
        platform
      );
      data = collectionData;
    }

    let prompt;
    if (!prompt) {
      prompt = await getUserPrompt(activeUser, userSettings, prompt);
    }

    const provider =
      providersMap[
        userSettings?.provider?.toLowerCase() as keyof typeof providersMap
      ];
    console.log("provider", provider);
    if (!provider) {
      throw new Error(
        "No AI provider selected. Please open Settings (top right) make sure you add an API key and select a provider under the 'AI Provider' tab."
      );
    }

    /* Fallback Settings last ditch effort to save from a failure */
    if (!title) {
      title = messages[messages.length - 1].content.substring(0, 20);
    }
    if (!userSettings.temperature) {
      userSettings.temperature = 0.5;
    }
    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    const result = (await provider({
      messages,
      activeUser,
      userSettings,
      prompt,
      conversationId,
      mainWindow,
      currentTitle: title,
      collectionId: collectionId ? Number(collectionId) : undefined,
      data: data ? data : undefined,
      signal,
    })) as ProviderResponse;

    try {
      await addUserMessage(activeUser, conversationId, messages);
      await addAssistantMessage(
        activeUser,
        conversationId,
        result,
        collectionId ? Number(collectionId) : undefined,
        data ? data : null
      );
    } catch (error) {
      log.error("Error adding messages:", error);
    }

    log.info(`Returning result`);

    return {
      ...result,
      messages: result.messages.map((msg) => ({
        ...msg,
        reasoning_content:
          msg.role === "assistant" ? result.reasoning : undefined,
      })),
      data_content: data ? JSON.stringify(data) : undefined,
      reasoning_content: result.reasoning ? result.reasoning : undefined,
      title: title || messages[messages.length - 1].content.substring(0, 20),
    };
  } catch (error) {
    log.error("Error in chat request:", error);

    let errorMessage = "An unexpected error occurred.";

    if (error instanceof Error) {
      // Handle API key related errors
      if (
        error.message.includes("API key") ||
        error.message.includes("provider")
      ) {
        errorMessage =
          "Please add an API key and select an AI Model in Settings.";
      }
      // Handle aborted requests
      else if (error.message.includes("aborted")) {
        errorMessage = "The request was cancelled.";
      }
      // Use the actual error message for other cases
      else {
        errorMessage = error.message;
      }
    }

    const newMessage = {
      role: "assistant",
      content: errorMessage,
      timestamp: new Date(),
      data_content: undefined,
    } as Message;

    log.info(`New message: ${newMessage}`);

    return {
      id: -1,
      messages: [...messages, newMessage],
      title: "Error",
    };
  }
}
