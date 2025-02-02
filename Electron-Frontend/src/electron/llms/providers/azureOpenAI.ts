import { chatCompletion } from "../chatCompletion.js";
import { providerInitialize } from "../llmHelpers/providerInit.js";
export async function AzureOpenAIProvider(
  params: ProviderInputParams
): Promise<ProviderResponse> {
  const openai = await providerInitialize("azure open ai", params.activeUser);

  return chatCompletion(openai, params);
}
