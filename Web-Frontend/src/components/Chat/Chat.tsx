"use client";
import { ArrowDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";

import { ChatMessagesArea } from "./ChatComponents/ChatMessagesArea";
import ChatInput from "./ChatComponents/ChatInput";
import { LoadingIndicator } from "./ChatComponents/LoadingIndicator";
import { useState } from "react";

export default function Chat() {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollToBottom, setScrollToBottom] = useState<() => void>(() => {});

  return (
    <div className="pt-5 h-[calc(100vh-2rem)] flex flex-col overflow-y-hidden">
      <div className={`flex flex-col h-full overflow-hidden relative`}>
        <ChatMessagesArea />

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
