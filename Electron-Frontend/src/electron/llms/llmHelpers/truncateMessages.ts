import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { countMessageTokens } from "./countMessageTokens.js";

// Helper function to truncate messages to fit within token limit
export function truncateMessages(
  messages: ChatCompletionMessageParam[],
  maxOutputTokens: number,
  maxTotalTokens: number = 4096,
  model?: string
): ChatCompletionMessageParam[] {
  const reservedTokens = 3; // Few tokens reserved for formatting

  let totalTokens = messages.reduce(
    (sum, msg) => sum + countMessageTokens(msg),
    0
  );

  // Calculate available tokens for conversation
  const availableTokens = maxTotalTokens - maxOutputTokens / 2 - reservedTokens;
  const currentTokens = totalTokens;

  // If we're under the limit and it's not deepseek-reasoner, return all messages unchanged
  if (
    currentTokens <= availableTokens &&
    !model?.includes("deepseek-reasoner")
  ) {
    return messages;
  }

  // Create a copy of messages for truncation
  let truncatedMessages = [...messages];

  // For deepseek-reasoner, ensure first message is from user
  if (model?.includes("deepseek-reasoner") && truncatedMessages.length > 0) {
    // Find the first user message
    const firstUserMsgIndex = truncatedMessages.findIndex(
      (msg) => msg.role === "user"
    );
    if (firstUserMsgIndex > 0) {
      // If we found a user message and it's not first, slice from there
      truncatedMessages = truncatedMessages.slice(firstUserMsgIndex);
    } else if (firstUserMsgIndex === -1) {
      // If no user message found, we can't proceed with deepseek-reasoner
      throw new Error("DeepSeek Reasoner requires at least one user message");
    }
  }

  // Only truncate if we're over the total token limit
  while (currentTokens > availableTokens && truncatedMessages.length > 3) {
    // Remove oldest messages first, keeping at least the last 3 messages
    const removed = truncatedMessages.shift();
    if (removed) {
      totalTokens -= countMessageTokens(removed);
    }
  }

  // Special case: if this is the first message, just return it
  if (messages.length === 1 && messages[0].role === "user") {
    return messages;
  }

  // For all other cases, ensure we have valid message pattern (user -> assistant -> user)
  if (truncatedMessages.length >= 3) {
    // Find last user message
    const lastUserIndex = truncatedMessages.length - 1;
    const secondLastUserIndex = truncatedMessages
      .slice(0, -1)
      .findLastIndex((msg) => msg.role === "user");
    const assistantAfterSecondLastUser = truncatedMessages
      .slice(secondLastUserIndex + 1)
      .find((msg) => msg.role === "assistant");

    if (
      truncatedMessages[lastUserIndex].role !== "user" ||
      !assistantAfterSecondLastUser
    ) {
      // If pattern is invalid, keep only the last 3 messages that match the pattern
      const lastMessages = truncatedMessages.slice(-3);
      if (
        lastMessages[0].role === "user" &&
        lastMessages[1].role === "assistant" &&
        lastMessages[2].role === "user"
      ) {
        truncatedMessages = lastMessages;
      } else {
        throw new Error(
          "Cannot create a valid message pattern with user -> assistant -> user"
        );
      }
    }

    // Trim from start to ensure first message is user
    while (
      truncatedMessages.length > 0 &&
      truncatedMessages[0].role !== "user"
    ) {
      truncatedMessages.shift();
    }
  } else if (truncatedMessages.length !== 1) {
    throw new Error(
      "Need at least 3 messages to maintain user -> assistant -> user pattern"
    );
  }

  console.log("Truncated messages:", truncatedMessages);
  return truncatedMessages;
}
