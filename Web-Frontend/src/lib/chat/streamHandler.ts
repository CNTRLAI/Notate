import { sendChatUpdate } from "@/src/app/api/chat/stream/route";

export class ChatStreamHandler {
  private requestId: string;
  private messageBuffer: string = "";
  private reasoningBuffer: string = "";

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  sendContent(content: string) {
    this.messageBuffer += content;
    sendChatUpdate(this.requestId, {
      type: "content",
      content: content,
    });
  }

  sendReasoning(reasoning: string) {
    this.reasoningBuffer += reasoning;
    sendChatUpdate(this.requestId, {
      type: "reasoning",
      content: reasoning,
    });
  }

  sendAgentAction(action: string) {
    sendChatUpdate(this.requestId, {
      type: "agent",
      content: action,
    });
  }

  complete() {
    sendChatUpdate(this.requestId, {
      type: "complete"
    });
  }

  error(message: string) {
    sendChatUpdate(this.requestId, {
      type: "error",
      content: message
    });
  }
} 