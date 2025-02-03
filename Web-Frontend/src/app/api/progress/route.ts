import { NextResponse } from 'next/server';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Keep track of the connection
      const connectionId = Date.now().toString();
      
      // Store the controller for this connection
      progressControllers.set(connectionId, controller);

      // Cleanup when the connection is closed
      return () => {
        progressControllers.delete(connectionId);
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

// Store active SSE connections
const progressControllers = new Map<string, ReadableStreamDefaultController>();

// Helper function to send progress updates
export function sendProgress(data: { type: string; message: string; progress?: number }) {
  const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
  
  // Send to all active connections
  progressControllers.forEach((controller) => {
    controller.enqueue(encodedData);
  });
} 