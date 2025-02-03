export type Model = {
  name: string;
  type: string;
  model_location: string;
  modified_at: string;
  size: number;
  digest: string;
};

export type CustomModel = {
  id: number;
  user_id: number;
  name: string;
  endpoint: string;
  api_key: string;
  model?: string;
};
export type AzureModel = {
  id: number;
  name: string;
  endpoint: string;
  deployment: string;
  apiKey: string;
};
export type OllamaModel = {
  name: string;
  type: string;
};

export type OpenRouterModel = string;
