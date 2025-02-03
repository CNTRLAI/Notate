"use client";
import { ArrowDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";

import { ChatMessagesArea } from "./ChatComponents/ChatMessagesArea";
import { ChatInput } from "./ChatComponents/ChatInput";
import { LoadingIndicator } from "./ChatComponents/LoadingIndicator";
import { useChatInput } from "@/src/context/useChatInput";
import { useUser } from "@/src/context/useUser";
import { useChatLogic } from "@/src/hooks/useChatLogic";

export default function Chat() {
  const {
    scrollAreaRef,
    resetCounter,
    bottomRef,
    showScrollButton,
    scrollToBottom,
  } = useChatLogic();

  const { streamingMessage, streamingMessageReasoning, messages, error } =
    useUser();

  const { isLoading } = useChatInput();

  return (
    <div className="pt-5 h-[calc(100vh-1rem)] flex flex-col">
      <div className={`flex flex-col h-full overflow-hidden relative`}>
        <ChatMessagesArea
          scrollAreaRef={scrollAreaRef}
          messages={messages}
          streamingMessage={streamingMessage}
          streamingMessageReasoning={streamingMessageReasoning}
          error={error}
          resetCounter={resetCounter}
          bottomRef={bottomRef}
        />

        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-32 right-8 rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}

        {isLoading && (
          <div className="flex justify-center">
            <LoadingIndicator />
          </div>
        )}

        <div className="">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
