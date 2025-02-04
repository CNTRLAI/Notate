"use server";

import { Message } from "@/src/types/messages";
import { User } from "@/src/types/user";
import { getSettingById } from "@/src/data/settings";
import { createMessage } from "@/src/data/messages";
import { providersMap } from "./llmHelpers/providersMap";
import db from "@/src/lib/db";
import { getPromptById } from "@/src/data/settings";
import { ChatRequestResult } from "@/src/types/providers";
import { ChatStreamCallbacks } from "../chat";

export async function chatRequest(
  messages: Message[],
  activeUser: User,
  conversationId?: number,
  collectionId?: bigint | number,
  title?: string,
  requestId?: string,
  callbacks?: ChatStreamCallbacks
): Promise<ChatRequestResult> {
  try {
    console.log(activeUser.id);
    const userSettings = await getSettingById(Number(activeUser.id));
    console.log("User settings created", userSettings);
    if (!userSettings) {
      throw new Error(
        "No user settings found. Please configure your settings first."
      );
    }
    if (!title && conversationId) {
      const conversation = await db.conversations.findUnique({
        where: { id: conversationId },
        select: { title: true },
      });
      title = conversation?.title;
    }
    console.log("Title", title);
    if (!conversationId) {
      const newConversation = await db.conversations.create({
        data: {
          title:
            title || messages[messages.length - 1].content.substring(0, 20),
          user_id: activeUser.id,
        },
      });
      conversationId = newConversation.id;
      title = newConversation.title;
    }
    console.log("Conversation ID", conversationId);
    let data;
    if (collectionId) {
      const collection = await db.collections.findUnique({
        where: { id: Number(collectionId) },
      });
      if (collection) {
        data = collection;
      }
    }
    console.log("Data", data);
    let prompt;
    if (userSettings.promptId) {
      console.log("User settings prompt ID", userSettings.promptId);
      if (userSettings.promptId === "default") {
        prompt =
          "You are a helpful assistant that can answer questions and help with tasks.";
      } else {
        prompt = await getPromptById(Number(userSettings.promptId));
      }
    }
    console.log("Prompt", prompt);
    const provider =
      providersMap[
        userSettings.provider?.toLowerCase() as keyof typeof providersMap
      ];
    console.log("Provider", provider);
    if (!provider) {
      throw new Error(
        "No AI provider selected. Please open Settings and make sure you add an API key and select a provider under the 'AI Provider' tab."
      );
    }

    /* Fallback Settings */
    if (!title) {
      title = messages[messages.length - 1].content.substring(0, 20);
    }
    if (!userSettings.temperature) {
      userSettings.temperature = 0.5;
    }
    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    console.log("Provider", provider);
    const result = await provider({
      messages,
      activeUser,
      userSettings,
      prompt: prompt ? (prompt as { prompt: string }).prompt : "",
      conversationId,
      currentTitle: title,
      collectionId: collectionId ? Number(collectionId) : undefined,
      data: data
        ? {
            top_k: 10,
            results: [
              {
                content: JSON.stringify(data),
                metadata:
                  typeof data === "object"
                    ? JSON.stringify(data)
                    : "No metadata",
              },
            ],
          }
        : {
            top_k: 0,
            results: [
              {
                content: "nothing",
                metadata: "nothing",
              },
            ],
          }
    });

    // Save messages to database
    const userMessage = messages[messages.length - 1];
    await createMessage(
      {
        role: userMessage.role,
        content: userMessage.content,
        conversation_id: conversationId,
      } as Message,
      activeUser.id,
      conversationId
    );

    await createMessage(
      {
        role: "assistant",
        content: result.messages[result.messages.length - 1].content,
        reasoning_content: result.reasoning,
        conversation_id: conversationId,
        data_content: data ? JSON.stringify(data) : undefined,
      } as Message,
      activeUser.id,
      conversationId
    );

    return {
      ...result,
      messages: result.messages.map((msg: Message) => ({
        ...msg,
        reasoning_content:
          msg.role === "assistant" ? result.reasoning : undefined,
      })),
      data_content: data ? JSON.stringify(data) : undefined,
      reasoning_content: result.reasoning,
      title: title,
    };
  } catch (error) {
    console.error("Error in chat request:", error);

    let errorMessage = "An unexpected error occurred.";

    if (error instanceof Error) {
      if (
        error.message.includes("API key") ||
        error.message.includes("provider")
      ) {
        errorMessage =
          "Please add an API key and select an AI Model in Settings.";
      } else if (error.message.includes("aborted")) {
        errorMessage = "The request was cancelled.";
      } else {
        errorMessage = error.message;
      }
    }

    const newMessage = {
      role: "assistant",
      content: errorMessage,
      timestamp: new Date(),
      data_content: undefined,
    } as Message;

    return {
      id: -1,
      messages: [...messages, newMessage],
      title: "Error",
    };
  }
}
