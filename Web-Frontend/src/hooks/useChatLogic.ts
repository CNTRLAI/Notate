import { useChatInput } from "@/src/context/useChatInput";
import { useUser } from "@/src/context/useUser";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { Message } from "@/src/types/messages";

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
  } = useUser();

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
      // Initial check when component mounts
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
    let isSubscribed = true;

    if (isLoading && currentRequestId) {
      eventSource = new EventSource(
        `/api/chat/stream?requestId=${currentRequestId}`
      );

      eventSource.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === "reasoning") {
            newReasoning += data.content;
            setStreamingMessageReasoning(newReasoning);
          } else if (data.type === "agent") {
            setAgentActions(data.content);
          } else if (data.type === "content") {
            newMessage += data.content;
            setStreamingMessage(newMessage);
          } else if (data.type === "complete") {
            const finalMessage = newMessage;
            const finalReasoning = newReasoning;

            setMessages((prevMessages: Message[]) => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (!lastMessage || lastMessage.role === "user") {
                return [
                  ...prevMessages,
                  {
                    role: "assistant",
                    content: finalMessage,
                    reasoning_content: finalReasoning,
                    timestamp: new Date(),
                  },
                ];
              } else if (lastMessage.role === "assistant") {
                const updatedMessage = {
                  ...lastMessage,
                  content: finalMessage,
                  reasoning_content: finalReasoning,
                };
                return [...prevMessages.slice(0, -1), updatedMessage];
              }
              return prevMessages;
            });

            if (!hasUserScrolled) {
              requestAnimationFrame(() => {
                if (!isSubscribed) return;
                const scrollElement = scrollAreaRef.current?.querySelector(
                  "[data-radix-scroll-area-viewport]"
                );
                if (scrollElement) {
                  scrollElement.scrollTo({
                    top: scrollElement.scrollHeight,
                    behavior: "instant",
                  });
                }
                setStreamingMessage("");
                setStreamingMessageReasoning("");
                setIsLoading(false);
                setCurrentRequestId(null);
              });
            } else {
              setStreamingMessage("");
              setStreamingMessageReasoning("");
              setIsLoading(false);
              setCurrentRequestId(null);
            }

            eventSource?.close();
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        eventSource?.close();
        setIsLoading(false);
        setCurrentRequestId(null);
      };
    }

    return () => {
      isSubscribed = false;
      eventSource?.close();
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
    hasUserScrolled,
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
