import { ProviderInputParams } from "@/src/types/providers";
import { ProviderResponse } from "@/src/types/providers";
import { chatCompletion } from "../chatCompletion";
import { providerInitialize } from "../llmHelpers/providerInit";
export async function AzureOpenAIProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("azure open ai", params.activeUser);

  return chatCompletion(openai, params);
}
