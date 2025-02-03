import { NextResponse } from "next/server";
import { chatRequest } from "@/src/lib/actions/llms/llms";
import { Message } from "@/src/types/messages";
import db from "@/src/lib/db";

export async function POST(request: Request) {
  try {
    const { message, requestId, userId, conversationId, collectionId } =
      await request.json();

    if (!requestId || !userId) {
      return NextResponse.json({
        error: "Missing required fields",
        status: 400,
      });
    }

    // Create message object
    const newMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Get user from database
    const user = await db.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        status: 404,
      });
    }

    // Process the chat message asynchronously
    chatRequest(
      [newMessage],
      user,
      conversationId,
      undefined,
      collectionId,
      undefined,
      requestId
    ).catch((error) => {
      console.error("Chat processing error:", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
