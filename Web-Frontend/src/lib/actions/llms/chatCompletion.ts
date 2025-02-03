import OpenAI from "openai";
import db from "@/src/lib/db";
import { openAiChainOfThought } from "./reasoningLayer/openAiChainOfThought";
import { prepMessages } from "./llmHelpers/prepMessages";
import { returnSystemPrompt } from "./llmHelpers/returnSystemPrompt";
import { truncateMessages } from "./llmHelpers/truncateMessages";
import { openAiAgent } from "./agentLayer/openAiAgent";
import { ProviderInputParams, ProviderResponse } from "@/src/types/providers";
import { Collection } from "@/src/types/collection";
import { Message } from "@/src/types/messages";

export async function chatCompletion(
  openai: OpenAI,
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const {
    messages,
    userSettings,
    collectionId,
    data,
    signal,
    conversationId,
    currentTitle,
    prompt,
  } = params;

  const maxOutputTokens = (userSettings.maxTokens as number) || 4096;
  const userId = params.activeUser.id;
  const userTools = await db.user_tools.findMany({
    where: {
      user_id: userId,
    },
  });
  console.log("userTools", userTools);
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

  console.log(agentActions);

  const newMessages = await prepMessages(messages);

  let dataCollectionInfo;

  if (collectionId) {
    dataCollectionInfo = {
      ...(await db.collections.findUnique({
        where: {
          user_id: userId,
          id: Number(collectionId),
        },
      })),
      userId: userId,
    } as Collection;
  }

  // If the user has COT enabled, we need to do reasoning second
  let reasoning;

  if (userSettings.cot) {
    // Do reasoning first
    reasoning = await openAiChainOfThought(
      openai,
      newMessages,
      maxOutputTokens,
      userSettings,
      data ? data : null,
      dataCollectionInfo ? dataCollectionInfo : null,
      String(JSON.stringify(agentActions)),
      webSearchResult ? webSearchResult : undefined,
      signal
    );
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
      max_tokens: Number(maxOutputTokens),
    },
    { signal }
  );

  const newMessage: Message = {
    role: "assistant",
    content: "",
    timestamp: new Date(),
    data_content: data ? JSON.stringify(data) : undefined,
  };

  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        throw new Error("AbortError");
      }
      const content = chunk.choices[0]?.delta?.content || "";
      newMessage.content += content;
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
      return {
        id: conversationId,
        messages: messages,
        reasoning: reasoning || "",
        title: currentTitle,
        content: "",
        aborted: true,
      };
    }
    throw error;
  }
}
