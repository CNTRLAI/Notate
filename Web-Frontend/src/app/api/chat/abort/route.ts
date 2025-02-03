import { NextResponse } from 'next/server';
import { chatControllers } from '../stream/route';

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json();
    
    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const controller = chatControllers.get(requestId);
    if (controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', content: 'Request cancelled' })}\n\n`));
      controller.close();
      chatControllers.delete(requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to abort request' }, { status: 500 });
  }
} 