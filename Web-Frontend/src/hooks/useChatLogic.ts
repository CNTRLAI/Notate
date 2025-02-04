import { useChatInput } from "@/src/context/useChatInput";
import { useUser } from "@/src/context/useUser";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { useLibrary } from "../context/useLibrary";

export function useChatLogic() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [resetCounter, setResetCounter] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const {
    handleResetChat: originalHandleResetChat,
    agentActions,
    setAgentActions,
    streamingMessage,
    setStreamingMessage,
    streamingMessageReasoning,
    setStreamingMessageReasoning,
    messages,
    setMessages,
    currentRequestId,
    setCurrentRequestId,
    activeUser,
    title,
    activeConversation,
  } = useUser();
  const { selectedCollection } = useLibrary();
  const { isLoading, setIsLoading } = useChatInput();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior,
      });
      setShouldAutoScroll(true);
      setHasUserScrolled(false);
    }
  };

  useEffect(() => {
    if ((shouldAutoScroll || !hasUserScrolled) && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        scrollToBottom("instant");
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    messages,
    streamingMessage,
    streamingMessageReasoning,
    agentActions,
    isLoading,
    shouldAutoScroll,
    hasUserScrolled,
  ]);

  useEffect(() => {
    if (messages.length === 0) {
      setHasUserScrolled(false);
      setShouldAutoScroll(true);
    }
  }, [messages.length]);

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    const handleScroll = () => {
      if (!scrollElement) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      const needsScroll = scrollHeight > clientHeight;

      setShowScrollButton(!isNearBottom && needsScroll);
      setShouldAutoScroll(isNearBottom);

      if (!hasUserScrolled && !isNearBottom) {
        setHasUserScrolled(true);
      }
    };

    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [hasUserScrolled]);

  useEffect(() => {
    let newMessage: string = "";
    let newReasoning: string = "";
    let eventSource: EventSource | null = null;

    if (isLoading && currentRequestId) {
      // First establish SSE connection
      eventSource = new EventSource(
        `/api/chat/stream?requestId=${currentRequestId}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "content") {
            newMessage += data.content;
            setStreamingMessage(newMessage);
          } else if (data.type === "reasoning") {
            newReasoning += data.content;
            setStreamingMessageReasoning(newReasoning);
          } else if (data.type === "agent") {
            setAgentActions(data.content);
          } else if (data.type === "complete") {
            const result = data;
            if (result.messages && result.messages.length > 0) {
              const assistantMessage =
                result.messages[result.messages.length - 1];
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (!lastMessage || lastMessage.role === "user") {
                  return [
                    ...prevMessages,
                    {
                      ...assistantMessage,
                      timestamp: new Date(),
                    },
                  ];
                } else if (lastMessage.role === "assistant") {
                  return [...prevMessages.slice(0, -1), assistantMessage];
                }
                return prevMessages;
              });
            }
            setStreamingMessage("");
            setStreamingMessageReasoning("");
            setAgentActions("");
            setIsLoading(false);
            setCurrentRequestId(null);
            eventSource?.close();
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
          setIsLoading(false);
          setCurrentRequestId(null);
          eventSource?.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        setStreamingMessage("");
        setStreamingMessageReasoning("");
        setAgentActions("");
        setIsLoading(false);
        setCurrentRequestId(null);
        eventSource?.close();
      };

      // Then send the chat request
      fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: currentRequestId,
          userId: activeUser?.id,
          message: messages[messages.length - 1]?.content,
          conversationId: activeConversation,
          title: title || "",
          collectionId: selectedCollection?.id,
          onReasoning: (content: string) => {
            if (content === "complete") {
              setStreamingMessageReasoning("");
            } else {
              setStreamingMessageReasoning((prev) => prev + content);
            }
          },
        }),
      }).catch((error) => {
        console.error("Chat request error:", error);
        setIsLoading(false);
        setCurrentRequestId(null);
        eventSource?.close();
      });
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [
    isLoading,
    currentRequestId,
    setIsLoading,
    setMessages,
    setStreamingMessage,
    setStreamingMessageReasoning,
    setAgentActions,
    setCurrentRequestId,
    activeUser,
    activeConversation,
    title,
    selectedCollection,
    messages,
  ]);

  const handleResetChat = async () => {
    await originalHandleResetChat();
    setResetCounter((c) => c + 1);
    setHasUserScrolled(false);
    setShouldAutoScroll(true);
  };

  return {
    scrollAreaRef,
    resetCounter,
    bottomRef,
    shouldAutoScroll,
    hasUserScrolled,
    showScrollButton,
    handleResetChat,
    scrollToBottom,
  };
}
