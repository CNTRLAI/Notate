import { chatCompletion } from "../chatCompletion.js";
import { providerInitialize } from "../llmHelpers/providerInit.js";

export async function OpenAIProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("openai", params.activeUser);
  return chatCompletion(openai, params);
}
