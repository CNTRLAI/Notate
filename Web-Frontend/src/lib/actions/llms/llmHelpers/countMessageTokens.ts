import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { encoding_for_model } from "@dqbd/tiktoken";

// Helper function to count tokens in a message
export function countMessageTokens(
  message: ChatCompletionMessageParam
): number {
  const encoder = encoding_for_model("gpt-3.5-turbo");
  const content = typeof message.content === "string" ? message.content : "";
  const tokens = encoder.encode(content);
  encoder.free(); // Free up memory
  return tokens.length + 4; // 4 tokens for message format
}
