import { OpenAIProvider } from "../providers/openai.js";
import { AzureOpenAIProvider } from "../providers/azureOpenAI.js";
import { OpenRouterProvider } from "../providers/openrouter.js";
import { AnthropicProvider } from "../providers/anthropic.js";
import { GeminiProvider } from "../providers/gemini.js";
import { XAIProvider } from "../providers/xai.js";
import { LocalModelProvider } from "../providers/localModel.js";
import { OllamaProvider } from "../providers/ollama.js";
import { CustomProvider } from "../providers/customEndpoint.js";
import { DeepSeekProvider } from "../providers/deepseek.js";

export const providersMap = {
  openai: OpenAIProvider,
  openrouter: OpenRouterProvider,
  "azure open ai": AzureOpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  xai: XAIProvider,
  local: LocalModelProvider,
  ollama: OllamaProvider,
  custom: CustomProvider,
  deepseek: DeepSeekProvider,
};
