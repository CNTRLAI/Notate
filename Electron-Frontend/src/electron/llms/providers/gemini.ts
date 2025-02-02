import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
  Content,
} from "@google/generative-ai";
import db from "../../db.js";
import { BrowserWindow } from "electron";
import { truncateMessages } from "../llmHelpers/truncateMessages.js";
import { sendMessageChunk } from "../llmHelpers/sendMessageChunk.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { returnSystemPrompt } from "../llmHelpers/returnSystemPrompt.js";
import { geminiAgent } from "../agentLayer/geminiAgent.js";

let genAI: GoogleGenerativeAI;

async function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

async function chainOfThought(
  messages: ChatCompletionMessageParam[],
  maxOutputTokens: number,
  userSettings: UserSettings,
  prompt: string,
  data: {
    top_k: number;
    results: {
      content: string;
      metadata: string;
    }[];
  } | null,
  dataCollectionInfo: Collection | null,
  signal?: AbortSignal,
  mainWindow: BrowserWindow | null = null
) {
  // Use reasoning-specific system prompt
  const sysPromptContent =
    "You are a reasoning engine. Your task is to analyze the question and outline your step-by-step reasoning process for how to answer it. Keep your reasoning concise and focused on the key logical steps. Only return the reasoning process, do not provide the final answer." +
    (data
      ? "\n\nThe following is the data that the user has provided via their custom data collection: " +
        `\n\n${JSON.stringify(data)}` +
        `\n\nCollection/Store Name: ${dataCollectionInfo?.name}` +
        `\n\nCollection/Store Files: ${dataCollectionInfo?.files}` +
        `\n\nCollection/Store Description: ${dataCollectionInfo?.description}` +
        `\n\n*** THIS IS THE END OF THE DATA COLLECTION ***`
      : "");

  const truncatedMessages = truncateMessages(messages, maxOutputTokens);

  // Create a separate array for reasoning messages
  const reasoningMessages = [...truncatedMessages];
  if (reasoningMessages.length > 0) {
    const firstMsg = reasoningMessages[0];
    firstMsg.content = `${sysPromptContent}\n\n${firstMsg.content}`;
  }

  const chat = genAI
    .getGenerativeModel({
      model: userSettings.model as string,
    })
    .startChat({
      history: reasoningMessages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content as string }],
        })),
      generationConfig: {
        temperature: Number(userSettings.temperature),
        maxOutputTokens: maxOutputTokens,
      },
    });

  let reasoningContent = "";
  const result = await chat.sendMessageStream(
    messages[messages.length - 1].content as string,
    { signal }
  );

  for await (const chunk of result.stream) {
    if (signal?.aborted) {
      throw new Error("AbortError");
    }
    let content = "";

    if (typeof chunk.text === "function") {
      content = chunk.text();
    } else if (chunk.candidates && chunk.candidates.length > 0) {
      const candidate = chunk.candidates[0];
      if (candidate.content && candidate.content.parts) {
        content = candidate.content.parts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join("");
      }
    }

    if (content) {
      reasoningContent += content;
      sendMessageChunk("[REASONING]: " + content, mainWindow);
    }
  }

  return reasoningContent;
}

export async function GeminiProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const {
    messages,
    activeUser,
    userSettings,
    prompt,
    conversationId,
    mainWindow,
    currentTitle,
    collectionId,
    data,
    signal,
  } = params;
  const apiKey = db.getApiKey(activeUser.id, "gemini");
  if (!apiKey) {
    throw new Error("Gemini API key not found for the active user");
  }
  await initializeGemini(apiKey);

  if (!genAI) {
    throw new Error("Gemini instance not initialized");
  }

  let dataCollectionInfo;
  if (collectionId) {
    dataCollectionInfo = db.getCollection(collectionId) as Collection;
  }

  const model: GenerativeModel = genAI.getGenerativeModel({
    model: userSettings.model as string,
  });

  const maxOutputTokens = (userSettings.maxTokens as number) || 4096;
  let webSearchResult;
  let agentActions;
  const userTools = db.getUserTools(activeUser.id);
  if (
    userTools.length > 0 &&
    userTools.some((tool) => tool.tool_id === 1 && tool.enabled === 1)
  ) {
    const { content, webSearchResult: webSearchResultFromAgent } =
      await geminiAgent(
        genAI,
        messages,
        maxOutputTokens,
        userSettings,
        signal,
        mainWindow
      );
    webSearchResult = webSearchResultFromAgent;
    agentActions = content;
  }
  console.log(agentActions);
  const newMainMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  })) as ChatCompletionMessageParam[];

  const newReasoningMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  })) as ChatCompletionMessageParam[];

  // Truncate messages to fit within token limits
  const truncatedMessages = truncateMessages(
    newReasoningMessages,
    maxOutputTokens
  );

  const temperature = Number(userSettings.temperature);

  let reasoning;
  if (userSettings.cot) {
    // Do reasoning first
    reasoning = await chainOfThought(
      truncatedMessages,
      maxOutputTokens,
      userSettings,
      prompt,
      data ? data : null,
      dataCollectionInfo ? dataCollectionInfo : null,
      signal,
      mainWindow
    );

    // Send end of reasoning marker
    if (mainWindow) {
      mainWindow.webContents.send("reasoningEnd");
    }
  }
  
  const newSysPrompt = await returnSystemPrompt(
    prompt,
    dataCollectionInfo,
    reasoning || null,
    webSearchResult || undefined,
    data
  );
  // Create a fresh copy of messages for the main response
  const mainMessages = [...newMainMessages];
  // Add system prompt as first message if messages array is empty, otherwise update first message
  if (mainMessages.length === 0) {
    mainMessages.push({
      role: "user",
      content: JSON.stringify(newSysPrompt),
    });
  } else {
    mainMessages[0] = {
      ...mainMessages[0],
      content: `${JSON.stringify(newSysPrompt)}\n\n${mainMessages[0].content}`,
    };
  }
  console.log(mainMessages);
  const chat: ChatSession = model.startChat({
    history: mainMessages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content as string }],
      })) as Content[],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxOutputTokens,
      topP: reasoning ? 0.1 : Number(userSettings.topP || 1),
    },
  });

  const newMessage: Message = {
    role: "assistant",
    content: "",
    timestamp: new Date(),
    data_content: data ? JSON.stringify(data) : undefined,
  };

  try {
    const result = await chat.sendMessageStream(
      messages[messages.length - 1].content,
      { signal }
    );

    let buffer = "";
    for await (const chunk of result.stream) {
      if (signal?.aborted) {
        throw new Error("AbortError");
      }
      let content = "";

      if (typeof chunk.text === "function") {
        content = chunk.text();
      } else if (chunk.candidates && chunk.candidates.length > 0) {
        const candidate = chunk.candidates[0];
        if (candidate.content && candidate.content.parts) {
          content = candidate.content.parts
            .filter((part) => part.text)
            .map((part) => part.text)
            .join("");
        }
      }

      if (content) {
        buffer += content;
        while (buffer.length >= 1) {
          const chunkToSend = buffer.slice(0, 1);
          buffer = buffer.slice(1);
          newMessage.content += chunkToSend;
          sendMessageChunk(chunkToSend, mainWindow);
        }
      }
    }

    if (buffer.length > 0) {
      newMessage.content += buffer;
      sendMessageChunk(buffer, mainWindow);
    }

    if (mainWindow) {
      mainWindow.webContents.send("streamEnd");
    }

    return {
      id: conversationId,
      messages: [...messages, newMessage],
      reasoning: reasoning || "",
      title: currentTitle,
      content: newMessage.content,
      aborted: false,
    };
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.message === "AbortError")
    ) {
      if (mainWindow) {
        mainWindow.webContents.send("streamEnd");
      }
      return {
        id: conversationId,
        messages: [...messages, { ...newMessage }],
        reasoning: reasoning || "",
        title: currentTitle,
        content: newMessage.content,
        aborted: true,
      };
    }
    throw error;
  }
}
