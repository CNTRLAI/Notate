import OpenAI from "openai";
import log from "electron-log";
export async function DeepSeekProviderAPIKeyCheck(
  apiKey: string,
  model?: string
): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (!apiKey) {
    log.error("DeepSeek API key not found for the active user");
    throw new Error("DeepSeek API key not found for the active user");
  }
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });

  const response = await openai.chat.completions.create({
    model: model || "deepseek-chat",
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
