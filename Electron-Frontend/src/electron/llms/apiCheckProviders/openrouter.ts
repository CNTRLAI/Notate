import OpenAI from "openai";
import log from "electron-log";
export async function OpenRouterProviderAPIKeyCheck(
  apiKey: string,
  model?: string
): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (!apiKey) {
    log.error("OpenRouter API key not found for the active user");
    throw new Error("OpenRouter API key not found for the active user");
  }
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const response = await openai.chat.completions.create({
    model: model || "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello, world!" }],
    max_tokens: 10,
  });
  log.info(`Response: ${JSON.stringify(response)}`);
  if (response.choices[0]?.message?.content) {
    return {
      success: true,
    };
  }

  return {
    error: "OpenRouter API key is invalid",
  };
}
