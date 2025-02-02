import { chatCompletion } from "../chatCompletion.js";
import { providerInitialize } from "../llmHelpers/providerInit.js";

export async function CustomProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("custom", params.activeUser);
  return chatCompletion(openai, params);
}
