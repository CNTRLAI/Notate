import { ScrollArea } from "@/components/ui/scroll-area";
import { NewConvoWelcome } from "./NewConvoWelcome";
import { ChatMessage } from "./ChatMessage";
import { StreamingReasoningMessage } from "./StreamingReasoningMessage";
import { StreamingMessage } from "./StreamingMessage";
import { formatDate } from "@/lib/utils";
export function ChatMessagesArea({
  scrollAreaRef,
  messages,
  streamingMessage,
  streamingMessageReasoning,
  error,
  resetCounter,
  bottomRef,
}: {
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  messages: Message[];
  streamingMessage: string | null;
  streamingMessageReasoning: string | null;
  error: string | null;
  resetCounter: number;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <ScrollArea
      ref={scrollAreaRef}
      className={`flex-grow px-4 relative`}
      style={{ height: "calc(100% - 8rem)" }}
    >
      {" "}
      {messages.length === 0 && <NewConvoWelcome key={resetCounter} />}
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${
            message.role === "user" ? "user-message" : "ai-message"
          }`}
          data-testid={`chat-message-${message.role}`}
        >
          <ChatMessage message={message} formatDate={formatDate} />
        </div>
      ))}
      {streamingMessageReasoning && <StreamingReasoningMessage />}
      {error && (
        <div className="text-red-500 mt-4 p-2 bg-red-100 rounded">
          Error: {error}
        </div>
      )}{" "}
      {streamingMessage && <StreamingMessage content={streamingMessage} />}
      <div ref={bottomRef} />
    </ScrollArea>
  );
}
