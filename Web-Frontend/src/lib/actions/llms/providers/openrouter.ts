import { providerInitialize } from "../llmHelpers/providerInit";
import { chatCompletion } from "../chatCompletion";
import { ProviderInputParams, ProviderResponse } from "@/src/types/providers";

export async function OpenRouterProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("openrouter", params.activeUser);
  return chatCompletion(openai, params);
}
