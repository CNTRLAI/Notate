import { providerInitialize } from "../llmHelpers/providerInit";
import { chatCompletion } from "../chatCompletion";
import { ProviderInputParams, ProviderResponse } from "@/src/types/providers";

export async function LocalModelProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("local", params.activeUser);
  return chatCompletion(openai, params);
}
