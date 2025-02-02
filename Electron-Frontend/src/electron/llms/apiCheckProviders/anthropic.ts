import Anthropic from "@anthropic-ai/sdk";
import log from "electron-log";
export async function AnthropicProviderAPIKeyCheck(apiKey: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (!apiKey) {
    log.error("Anthropic API key not found for the active user");
    throw new Error("Anthropic API key not found for the active user");
  }
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    messages: [{ role: "user", content: "Hello, world!" }],
    max_tokens: 10,
  });
  log.info(`Response: ${JSON.stringify(response)}`);    
  if (response.content) {
    return {
      success: true,
    };
  }

  return {
    error: "Anthropic API key is invalid",
  };
}
