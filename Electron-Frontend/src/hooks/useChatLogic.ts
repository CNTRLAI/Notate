import { useChatInput } from "@/context/useChatInput";
import { useUser } from "@/context/useUser";
import { useView } from "@/context/useView";
import { useEffect } from "react";

import { useRef } from "react";

import { useState } from "react";

export function useChatLogic() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [resetCounter, setResetCounter] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { setActiveView } = useView();
  const {
    handleResetChat: originalHandleResetChat,
    agentActions,
    setAgentActions,
    streamingMessage,
    setStreamingMessage,
    setStreamingMessageReasoning,
    streamingMessageReasoning,
    activeUser,
    messages,
    setMessages,
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

  // Move all the useEffects here
  useEffect(() => {
    if (messages.length === 0) {
      setHasUserScrolled(false);
      setShouldAutoScroll(true);
    }
  }, [messages.length]);

  // Move other effects...

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
    let isSubscribed = true; // Add a flag to prevent updates after unmount

    const handleMessageChunk = (chunk: string) => {
      if (!isSubscribed) return; // Skip if component is unmounted
      if (chunk.startsWith("[REASONING]:")) {
        newReasoning += chunk.replace("[REASONING]:", "");
        setStreamingMessageReasoning(newReasoning);
      } else if (chunk.startsWith("[Agent]:")) {
        setAgentActions(chunk.replace("[Agent]:", ""));
      } else {
        newMessage += chunk;
        setStreamingMessage(newMessage);
      }
    };

    const handleStreamEnd = () => {
      if (!isSubscribed) return;

      const finalMessage = newMessage;
      const finalReasoning = newReasoning;

      setMessages((prevMessages) => {
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

      // Ensure we stay at bottom when message completes
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
        // If user has scrolled, just update the state without forcing scroll
        setStreamingMessage("");
        setStreamingMessageReasoning("");
        setIsLoading(false);
        setCurrentRequestId(null);
      }

      newMessage = "";
      newReasoning = "";
    };

    // Remove any existing listeners before adding new ones
    window.electron.offMessageChunk(handleMessageChunk);
    window.electron.offStreamEnd(handleStreamEnd);

    // Add new listeners
    window.electron.onMessageChunk(handleMessageChunk);
    window.electron.onStreamEnd(handleStreamEnd);

    return () => {
      isSubscribed = false; // Set flag to prevent updates after unmount
      // Clean up listeners
      window.electron.offMessageChunk(handleMessageChunk);
      window.electron.offStreamEnd(handleStreamEnd);
    };
  }, [
    setIsLoading,
    setMessages,
    setStreamingMessage,
    setStreamingMessageReasoning,
    setAgentActions,
    setCurrentRequestId,
  ]);

  useEffect(() => {
    if (!activeUser) {
      setActiveView("SelectAccount");
    }
  }, [activeUser, setActiveView]);

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
