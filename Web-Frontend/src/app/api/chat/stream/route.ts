import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    return new NextResponse('Missing requestId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const connectionId = requestId;
      
      // Store the controller for this connection
      chatControllers.set(connectionId, controller);

      // Cleanup when the connection is closed
      return () => {
        chatControllers.delete(connectionId);
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Store active chat SSE connections
const chatControllers = new Map<string, ReadableStreamDefaultController>();

// Helper function to send updates to a specific chat stream
export function sendChatUpdate(requestId: string, data: { 
  type: 'reasoning' | 'agent' | 'content' | 'complete' | 'error';
  content?: string;
}) {
  const controller = chatControllers.get(requestId);
  if (controller) {
    const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
    controller.enqueue(encodedData);
  }
} 