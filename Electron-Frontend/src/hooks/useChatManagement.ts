import { useCallback, useState } from "react";

export const useChatManagement = (activeUser: User | null, onChatComplete?: () => void) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [streamingMessageReasoning, setStreamingMessageReasoning] =
    useState<string>("");
  const [agentActions, setAgentActions] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");

  const handleChatRequest = useCallback(
    async (collectionId: number | undefined, suggestion?: string) => {
      if (!activeUser) return;
      setIsLoading(true);
      const requestId = Date.now();
      setCurrentRequestId(requestId);

      setError(null);
      const newUserMessage = {
        role: "user",
        content: suggestion || input,
        timestamp: new Date(),
      } as Message;
      setMessages((prev) => [...prev, newUserMessage]);
      setInput("");

      try {
        const result = await window.electron.chatRequest(
          [...messages, newUserMessage],
          activeUser,
          undefined,
          collectionId,
          undefined,
          requestId
        );

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          console.error("Error in chat:", result.error);
        }

        setMessages(result.messages);
        
        // Notify parent of chat completion
        onChatComplete?.();

      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setError("Request was cancelled");
        } else {
          console.error("Error in chat:", error);
        }
      }
    },
    [activeUser, messages, input, onChatComplete]
  );

  const cancelRequest = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (currentRequestId) {
        window.electron.abortChatRequest(currentRequestId);
        setTimeout(() => {
          setStreamingMessage("");
          setStreamingMessageReasoning("");
          resolve();
        }, 100);
      } else {
        resolve();
      }
    });
  }, [currentRequestId]);

  return {
    messages,
    setMessages,
    streamingMessage,
    setStreamingMessage,
    streamingMessageReasoning,
    setStreamingMessageReasoning,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentRequestId,
    setCurrentRequestId,
    handleChatRequest,
    cancelRequest,
    input,
    setInput,
    agentActions,
    setAgentActions,
  };
};
