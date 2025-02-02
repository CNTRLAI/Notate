import { chatCompletion } from "../chatCompletion.js";
import { providerInitialize } from "../llmHelpers/providerInit.js";

export async function XAIProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("xai", params.activeUser);
  return chatCompletion(openai, params);
}
