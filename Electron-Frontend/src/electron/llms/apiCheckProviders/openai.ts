import OpenAI from "openai";
import log from "electron-log";
export async function OpenAIProviderAPIKeyCheck(apiKey: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (!apiKey) {
    log.error("OpenAI API key not found for the active user");
    throw new Error("OpenAI API key not found for the active user");
  }
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
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
    error: "OpenAI API key is invalid",
  };
}
