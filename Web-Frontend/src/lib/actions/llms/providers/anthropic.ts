import Anthropic from "@anthropic-ai/sdk";
/* import { sendMessageChunk } from "../llmHelpers/sendMessageChunk";*/
import { truncateMessages } from "../llmHelpers/truncateMessages";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { returnSystemPrompt } from "../llmHelpers/returnSystemPrompt";
import { returnReasoningPrompt } from "../llmHelpers/returnReasoningPrompt";
import { anthropicAgent } from "../agentLayer/anthropicAgent";
import { Collection } from "@/src/types/collection";
import { Message } from "@/src/types/messages";
import { UserSettings } from "@/src/types/settings";
import { ProviderResponse } from "@/src/types/providers";
import { ProviderInputParams } from "@/src/types/providers";
import { getApiKey } from "@/src/data/apiKeys";
import { getUserTools } from "@/src/data/tools";
import { getCollection } from "@/src/data/collections";

async function chainOfThought(
  anthropic: Anthropic,
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
  signal?: AbortSignal,
  onReasoning?: (content: string) => void
) {
  const reasoningPrompt = await returnReasoningPrompt(data, dataCollectionInfo);

  const truncatedMessages = truncateMessages(
    messages as Message[],
    maxOutputTokens
  );

  const stream = await anthropic.messages.stream(
    {
      messages: truncatedMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content as string,
      })),
      system: reasoningPrompt,
      model: userSettings.model as string,
      max_tokens: Number(maxOutputTokens),
      temperature: Number(userSettings.temperature),
    },
    { signal }
  );

  let reasoningContent = "";
  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        throw new Error("AbortError");
      }
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta &&
        typeof chunk.delta === "object"
      ) {
        const content = chunk.delta.text || "";
        reasoningContent += content;
        // Send reasoning to frontend
        if (onReasoning) {
          onReasoning(content);
        }
      }
    }

    // Send completion event for reasoning
    if (onReasoning) {
      onReasoning("complete");
    }
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.message === "AbortError")
    ) {
      throw error;
    }
  }

  return reasoningContent;
}

export async function AnthropicProvider(
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
    onContent,
    onReasoning,
    onAgentAction,
  } = params;

  const apiKey = await getApiKey(activeUser.id, "anthropic");
  if (!apiKey) {
    throw new Error("Anthropic API key not found for the active user");
  }

  const anthropic = new Anthropic({ apiKey: apiKey.key });

  const userTools = await getUserTools(activeUser.id);

  let agentActions = null;
  let webSearchResult = null;
  const maxOutputTokens = (userSettings.maxTokens as number) || 4096;

  // If the user has Web Search enabled, we need to do web search first
  if (userTools.find((tool) => tool.tool_id === 1)?.enabled === 1) {
    const { content: actions, webSearchResult: webResults } =
      await anthropicAgent(anthropic, messages, maxOutputTokens);
    agentActions = actions;
    webSearchResult = webResults;
    // Send agent actions to frontend
    if (onAgentAction && actions) {
      onAgentAction(actions);
    }
  }

  const newMessage: Message = {
    role: "assistant",
    content: "",
    timestamp: new Date(),
    data_content: data ? JSON.stringify(data) : undefined,
  };

  const newMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  })) as ChatCompletionMessageParam[];

  let dataCollectionInfo;
  if (collectionId) {
    const collection = await getCollection(collectionId);
    dataCollectionInfo = collection
      ? {
          ...collection,
          userId: collection.user_id,
        }
      : null;
  }

  let reasoning: string | undefined;

  if (userSettings.cot) {
    // Do reasoning first
    reasoning = await chainOfThought(
      anthropic,
      newMessages,
      maxOutputTokens,
      userSettings,
      data && "top_k" in data ? data : null,
      dataCollectionInfo ? dataCollectionInfo : null,
      undefined,
      onReasoning
    );
  }

  const sysPrompt = await returnSystemPrompt(
    prompt,
    dataCollectionInfo,
    reasoning || null,
    webSearchResult || undefined,
    data
  );

  // Truncate messages to fit within token limits
  const truncatedMessages = truncateMessages(newMessages, maxOutputTokens);

  const stream = await anthropic.messages.stream({
    temperature: Number(userSettings.temperature),
    system: sysPrompt.content,
    messages: truncatedMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content as string,
    })),
    model: userSettings.model as string,
    max_tokens: Number(maxOutputTokens),
  });

  try {
    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta &&
        typeof chunk.delta === "object"
      ) {
        const content = chunk.delta.text || "";
        newMessage.content += content;
        // Send content to frontend
        if (onContent) {
          onContent(content);
        }
      }
    }

    return {
      id: conversationId,
      messages: [...messages, newMessage],
      title: currentTitle,
      content: newMessage.content,
      reasoning: reasoning || "",
      aborted: false,
    };
  } catch (error) {
    throw error;
  }
}
