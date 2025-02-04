import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getEncoding } from "js-tiktoken";

// Helper function to count tokens in a message
export function countMessageTokens(
  message: ChatCompletionMessageParam
): number {
  const encoder = getEncoding("cl100k_base"); // encoding used by gpt-3.5-turbo and gpt-4
  const content = typeof message.content === "string" ? message.content : "";
  const tokens = encoder.encode(content);
  return tokens.length + 4; // 4 tokens for message format
}
