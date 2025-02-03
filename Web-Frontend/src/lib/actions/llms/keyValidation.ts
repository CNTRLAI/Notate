import { OpenAIProviderAPIKeyCheck } from "./apiCheckProviders/openai";
import { AnthropicProviderAPIKeyCheck } from "./apiCheckProviders/anthropic";
import { GeminiProviderAPIKeyCheck } from "./apiCheckProviders/gemini";
import { XAIProviderAPIKeyCheck } from "./apiCheckProviders/xai";
import { OpenRouterProviderAPIKeyCheck } from "./apiCheckProviders/openrouter";
import { DeepSeekProviderAPIKeyCheck } from "./apiCheckProviders/deepseek";

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
    return {
      ...result,
    };
  } catch (error) {
    console.error("Error in key validation:", error);
    return {
      error: "Error in key validation",
    };
  }
}
