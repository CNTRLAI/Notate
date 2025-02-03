export interface UserSettings {
  userId?: number;
  id?: number;
  cot?: number;
  vectorstore?: string;
  prompt?: number;
  temperature?: number;
  model?: string;
  provider?: string;
  isLocal?: boolean;
  modelDirectory?: string;
  modelType?: string;
  modelLocation?: string;
  ollamaIntegration?: number;
  ollamaModel?: string;
  baseUrl?: string;
  selectedAzureId?: number;
  selectedCustomId?: number;
  displayModel?: string;
  maxTokens?: number;
  topP?: number;
  promptId?: string;
  webSearch?: number;
}
