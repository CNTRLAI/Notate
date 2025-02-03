export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  reasoning_content?: string;
  timestamp?: Date;
  isRetrieval?: boolean;
  collectionId?: number;
  conversationId?: number;
  data_id?: number;
  data_content?: string;
};
