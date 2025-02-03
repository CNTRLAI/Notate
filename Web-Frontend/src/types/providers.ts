import { Message } from "./messages";
import { UserSettings } from "./settings";
import { User } from "./user";

export type LLMProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "xai"
  | "openrouter"
  | "local"
  | "ollama"
  | "azure open ai"
  | "custom"
  | "deepseek"
  | "";

export type ProviderResponse = {
  id: bigint | number;
  messages: Message[];
  reasoning?: string;
  aborted: boolean;
  title: string;
  content: string;
};

export interface ProviderInputParams {
  messages: Message[];
  activeUser: User;
  userSettings: UserSettings;
  prompt: string;
  conversationId: bigint | number;
  currentTitle: string;
  collectionId?: number;
  data: {
    top_k: number;
    results: {
      content: string;
      metadata: string;
    }[];
  };
  signal?: AbortSignal;
  onContent?: (content: string) => void;
  onReasoning?: (reasoning: string) => void;
  onAgentAction?: (action: string) => void;
}
export type ChatRequestResult = {
  id: bigint | number;
  messages: Message[];
  title?: string;
  reasoning_content?: string;
  data_content?: string;
};
