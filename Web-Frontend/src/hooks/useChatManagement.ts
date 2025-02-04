import { useCallback, useState, useTransition } from "react";
import { Message } from "../types/messages";
import { User } from "next-auth";
import { streamingChatAction } from "../lib/actions/chat";

export const useChatManagement = (
  activeUser: User | null,
  onChatComplete?: () => void
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [streamingMessageReasoning, setStreamingMessageReasoning] =
    useState<string>("");
  const [agentActions, setAgentActions] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleChatRequest = useCallback(
    async (collectionId: number | undefined, suggestion?: string) => {
      if (!activeUser) return;
      setIsLoading(true);
      setError(null);

      const newUserMessage = {
        role: "user",
        content: suggestion || input,
        timestamp: new Date(),
      } as Message;

      setMessages((prev) => [...prev, newUserMessage]);
      setInput("");

      try {
        startTransition(async () => {
          try {
            const result = await streamingChatAction(
              [...messages, newUserMessage],
              collectionId
            );

            if (result.error) {
              setError(result.error);
              setIsLoading(false);
              console.error("Error in chat:", result.error);
              return;
            }

            setMessages(result.messages);
          } catch (error) {
            console.error("Error in chat:", error);
            setError(
              error instanceof Error
                ? error.message
                : "An unexpected error occurred"
            );
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("Error in chat:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
        setIsLoading(false);
      }
    },
    [activeUser, messages, input, onChatComplete]
  );

  return {
    messages,
    setMessages,
    streamingMessage,
    setStreamingMessage,
    streamingMessageReasoning,
    setStreamingMessageReasoning,
    isLoading: isLoading || isPending,
    setIsLoading,
    error,
    setError,
    handleChatRequest,
    input,
    setInput,
    agentActions,
    setAgentActions,
  };
};
