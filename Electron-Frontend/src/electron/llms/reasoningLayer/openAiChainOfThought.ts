import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { truncateMessages } from "../llmHelpers/truncateMessages.js";
import { sendMessageChunk } from "../llmHelpers/sendMessageChunk.js";
import { BrowserWindow } from "electron";

export async function openAiChainOfThought(
  provider: OpenAI,
  messages: ChatCompletionMessageParam[],
  maxOutputTokens: number,
  userSettings: UserSettings,
  data: {
    top_k: number;
    results: {
      content: string;
      metadata: string;
    }[];
  } | null,
  dataCollectionInfo: Collection | null,
  agentActions?: string,
  webSearchResult?: WebSearchResult | null,
  signal?: AbortSignal,
  mainWindow: BrowserWindow | null = null
) {
  console.log("agentActions", agentActions);
  console.log("webSearchResult", webSearchResult);
  const sysPrompt: ChatCompletionMessageParam = {
    role: "system",
    content:
      `You are a reasoning engine. Your task is to analyze the question and outline your step-by-step reasoning process for how
      to answer it. Only return the reasoning process including important information from the agent's actions and web search results, 
      do not provide the final answer. The agent's actions are: ${agentActions}` +
      (webSearchResult
        ? `\n\nThe following is the web search results from the agent please include them in your reasoning process: ${JSON.stringify(
            webSearchResult
          )}`
        : "") +
      (data
        ? "The following is the data that the user has provided via their custom data collection: " +
          `\n\n${JSON.stringify(data)}` +
          `\n\nCollection/Store Name: ${dataCollectionInfo?.name}` +
          `\n\nCollection/Store Files: ${dataCollectionInfo?.files}` +
          `\n\nCollection/Store Description: ${dataCollectionInfo?.description}` +
          `\n\n*** THIS IS THE END OF THE DATA COLLECTION ***`
        : ""),
  };
  console.log(sysPrompt);
  const truncatedMessages = truncateMessages(messages, maxOutputTokens);
  const newMessages = [sysPrompt, ...truncatedMessages];
  const reasoning = await provider.chat.completions.create(
    {
      model: userSettings.model as string,
      messages: newMessages,
      stream: true,
      temperature: Number(userSettings.temperature),
      max_tokens: Number(maxOutputTokens),
    },
    { signal }
  );

  let reasoningContent = "";
  for await (const chunk of reasoning) {
    if (signal?.aborted) {
      throw new Error("AbortError");
    }
    const content = chunk.choices[0]?.delta?.content || "";
    reasoningContent += content;
    sendMessageChunk("[REASONING]: " + content, mainWindow);
  }

  return webSearchResult
    ? webSearchResult + reasoningContent
    : reasoningContent;
}
