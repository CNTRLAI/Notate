import { chatCompletion } from "../chatCompletion";
import { providerInitialize } from "../llmHelpers/providerInit";
import { ProviderInputParams, ProviderResponse } from "@/src/types/providers";

export async function XAIProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("xai", params.activeUser);
  return chatCompletion(openai, params);
}
