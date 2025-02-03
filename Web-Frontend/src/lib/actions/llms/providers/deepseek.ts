import OpenAI from "openai";
import db from "@/src/lib/db";
/* import { sendMessageChunk } from "../llmHelpers/sendMessageChunk"; */
import { truncateMessages } from "../llmHelpers/truncateMessages";
import { returnSystemPrompt } from "../llmHelpers/returnSystemPrompt";
import { prepMessages } from "../llmHelpers/prepMessages";
import { openAiChainOfThought } from "../reasoningLayer/openAiChainOfThought";
import { providerInitialize } from "../llmHelpers/providerInit";
import { openAiAgent } from "../agentLayer/openAiAgent";
import { ProviderInputParams } from "@/src/types/providers";
import { ProviderResponse } from "@/src/types/providers";
import { Message } from "@/src/types/messages";
import { Collection } from "@/src/types/collection";
import { getUserTools } from "@/src/data/tools";
interface DeepSeekDelta
  extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string;
}

export async function DeepSeekProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const {
    messages,
    activeUser,
    userSettings,
    prompt,
    conversationId,
    currentTitle,
    collectionId,
    data,
    signal,
  } = params;

  const openai = await providerInitialize("deepseek", activeUser);

  const maxOutputTokens = (userSettings.maxTokens as number) || 4096;
  const newMessages = await prepMessages(messages);

  const userTools = await getUserTools(activeUser.id);

  let agentActions = null;
  let webSearchResult = null;
  // If the user has Web Search enabled, we need to do web search first
  if (userTools.find((tool) => tool.tool_id === 1)?.enabled === 1) {
    const { content: actions, webSearchResult: webResults } = await openAiAgent(
      openai,
      messages,
      maxOutputTokens,
      userSettings,
      signal
    );
    agentActions = actions;
    webSearchResult = webResults;
  }

  let dataCollectionInfo;
  if (collectionId) {
    dataCollectionInfo = {
      ...(await db.collections.findUnique({
        where: { id: collectionId, user_id: activeUser.id },
      })),
      userId: (
        await db.collections.findUnique({
          where: { id: collectionId, user_id: activeUser.id },
        })
      )?.user_id,
    } as Collection;
  }

  let reasoning;
  // Only do manual CoT if not using deepseek-reasoner
  if (userSettings.cot && !userSettings.model?.includes("deepseek-reasoner")) {
    // Do reasoning first
    reasoning = await openAiChainOfThought(
      openai,
      newMessages,
      maxOutputTokens,
      userSettings,
      data ? data : null,
      dataCollectionInfo ? dataCollectionInfo : null,
      String(agentActions),
      webSearchResult ? webSearchResult : undefined,
      signal
    );

    /*  // Send end of reasoning marker
    if (mainWindow) {
      mainWindow.webContents.send("reasoningEnd");
    } */
  }
  const newSysPrompt = await returnSystemPrompt(
    prompt,
    dataCollectionInfo,
    reasoning ? reasoning : null,
    webSearchResult ? webSearchResult : undefined,
    data
  );

  // Truncate messages to fit within token limits while preserving max output tokens
  const truncatedMessages = truncateMessages(newMessages, maxOutputTokens);
  truncatedMessages.unshift(newSysPrompt);
  const stream = await openai.chat.completions.create(
    {
      model: userSettings.model as string,
      messages: truncatedMessages,
      stream: true,
      temperature: Number(userSettings.temperature),
      max_tokens: maxOutputTokens,
    },
    { signal }
  );

  const newMessage: Message = {
    role: "assistant",
    content: "",
    timestamp: new Date(),
    data_content: data ? JSON.stringify(data) : undefined,
  };

  let reasoningContent = "";

  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        throw new Error("AbortError");
      }

      const delta = chunk.choices[0]?.delta as DeepSeekDelta;

      if (delta?.reasoning_content) {
        reasoningContent += delta.reasoning_content;
        /*         sendMessageChunk("[REASONING]:" + delta.reasoning_content, mainWindow); */
      } else if (delta?.content) {
        const content = delta.content;
        newMessage.content += content;
        /*      sendMessageChunk(content, mainWindow); */
      }
    }

    /*  if (mainWindow) {
      mainWindow.webContents.send("streamEnd");
    } */

    return {
      id: conversationId,
      messages: [...messages, { ...newMessage, content: newMessage.content }],
      reasoning: reasoningContent || reasoning, // Use either deepseek-reasoner content or manual CoT reasoning
      title: currentTitle,
      content: newMessage.content,
      aborted: false,
    };
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.message === "AbortError")
    ) {
      return {
        id: conversationId,
        messages: messages,
        reasoning: reasoningContent,
        title: currentTitle,
        content: "",
        aborted: true,
      };
    }
    throw error;
  }
}
