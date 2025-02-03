import { useCallback, useState } from "react";
import { Message } from "../types/messages";
import { User } from "next-auth";

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
        // Make API request to chat endpoint
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: suggestion || input,
            requestId: requestId.toString(),
            userId: activeUser.id,
            collectionId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to send message");
        }

        // The actual message updates will come through the SSE connection
        // which is handled by the useChatLogic hook
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
    return new Promise<void>(async (resolve) => {
      if (currentRequestId) {
        try {
          await fetch("/api/chat/abort", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requestId: currentRequestId.toString(),
            }),
          });

          setStreamingMessage("");
          setStreamingMessageReasoning("");
          setIsLoading(false);
        } catch (error) {
          console.error("Failed to cancel request:", error);
        }
      }
      resolve();
    });
  }, [
    currentRequestId,
    setStreamingMessage,
    setStreamingMessageReasoning,
    setIsLoading,
  ]);

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
