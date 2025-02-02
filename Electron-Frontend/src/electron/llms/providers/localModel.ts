import { providerInitialize } from "../llmHelpers/providerInit.js";
import { chatCompletion } from "../chatCompletion.js";

export async function LocalModelProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("local", params.activeUser);
  return chatCompletion(openai, params);
}
