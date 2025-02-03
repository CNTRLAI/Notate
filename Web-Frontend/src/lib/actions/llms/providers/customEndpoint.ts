import { chatCompletion } from "../chatCompletion";
import { providerInitialize } from "../llmHelpers/providerInit";
import { ProviderInputParams } from "@/src/types/providers";
import { ProviderResponse } from "@/src/types/providers";

export async function CustomProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("custom", params.activeUser);
  return chatCompletion(openai, params);
}
