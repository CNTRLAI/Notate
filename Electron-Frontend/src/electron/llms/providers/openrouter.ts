import { providerInitialize } from "../llmHelpers/providerInit.js";
import { chatCompletion } from "../chatCompletion.js";

export async function OpenRouterProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("openrouter", params.activeUser);
  return chatCompletion(openai, params);
}
