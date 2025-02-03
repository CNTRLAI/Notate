import { OpenAIProvider } from "../providers/openai";
import { AzureOpenAIProvider } from "../providers/azureOpenAI";
import { OpenRouterProvider } from "../providers/openrouter";
import { AnthropicProvider } from "../providers/anthropic";
import { GeminiProvider } from "../providers/gemini";
import { XAIProvider } from "../providers/xai";
import { LocalModelProvider } from "../providers/localModel";
import { OllamaProvider } from "../providers/ollama";
import { CustomProvider } from "../providers/customEndpoint";
import { DeepSeekProvider } from "../providers/deepseek";

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
