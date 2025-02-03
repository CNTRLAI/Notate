import { useContext } from "react";
import { ChatInputContext } from "./ChatInputContext";

export const useChatInput = () => {
  const context = useContext(ChatInputContext);
  if (context === undefined) {
    throw new Error("useChatInput must be used within a UserProvider");
  }
  return context;
}; 