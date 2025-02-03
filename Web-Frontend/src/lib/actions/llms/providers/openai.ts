import { ProviderInputParams, ProviderResponse } from "@/src/types/providers";
import { chatCompletion } from "../chatCompletion";
import { providerInitialize } from "../llmHelpers/providerInit";

export async function OpenAIProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("openai", params.activeUser);
  return chatCompletion(openai, params);
}
