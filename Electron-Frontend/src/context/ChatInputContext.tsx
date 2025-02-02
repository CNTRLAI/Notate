import { createContext } from "react";

export interface ChatInputContextType {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleChatRequest: (collectionId: number | undefined, suggestion?: string) => Promise<void>;
  cancelRequest: () => Promise<void>;
}

export const ChatInputContext = createContext<ChatInputContextType | undefined>(undefined); 