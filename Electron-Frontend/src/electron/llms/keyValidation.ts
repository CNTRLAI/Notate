import { OpenAIProviderAPIKeyCheck } from "./apiCheckProviders/openai.js";
import { AnthropicProviderAPIKeyCheck } from "./apiCheckProviders/anthropic.js";
import { GeminiProviderAPIKeyCheck } from "./apiCheckProviders/gemini.js";
import { XAIProviderAPIKeyCheck } from "./apiCheckProviders/xai.js";
import { OpenRouterProviderAPIKeyCheck } from "./apiCheckProviders/openrouter.js";
import log from "electron-log";
import { DeepSeekProviderAPIKeyCheck } from "./apiCheckProviders/deepseek.js";
export async function keyValidation({
  apiKey,
  inputProvider,
}: {
  apiKey: string;
  inputProvider: string;
}): Promise<{
  error?: string;
  success?: boolean;
}> {
  try {
    let provider;
    log.info(`Input provider: ${inputProvider}`);
    switch (inputProvider.toLowerCase()) {
      case "deepseek":
        provider = DeepSeekProviderAPIKeyCheck;
        break;
      case "openai":
        provider = OpenAIProviderAPIKeyCheck;
        break;
      case "openrouter":
        provider = OpenRouterProviderAPIKeyCheck;
        break;
      case "anthropic":
        provider = AnthropicProviderAPIKeyCheck;
        break;
      case "gemini":
        provider = GeminiProviderAPIKeyCheck;
        break;
      case "xai":
        provider = XAIProviderAPIKeyCheck;
        break;
      default:
        throw new Error(
          "No AI provider selected. Please open Settings (top right) make sure you add an API key and select a provider under the 'AI Provider' tab."
        );
    }

    const result = await provider(apiKey);
    log.info(`Result: ${JSON.stringify(result)}`);
    return {
      ...result,
    };
  } catch (error) {
    log.error("Error in chat request:", error);
    return {
      error: "Error in chat request",
    };
  }
}
