"use server";

import { Message } from "@/src/types/messages";
import { chatRequest } from "./llms/llms";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { User } from "@/src/types/user";

export type ChatStreamCallbacks = {
  onContent: (content: string) => void;
  onReasoning: (content: string) => void;
  onAgentAction: (content: string) => void;
  onError: (error: string) => void;
  onComplete: () => void;
};

export async function streamingChatAction(
  messages: Message[],
  collectionId: number | undefined
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const result = await chatRequest(
      messages,
      { ...session.user, id: Number(session.user.id), collectionId } as User
    );

    // Revalidate the chat page to update the UI
    revalidatePath("/chat");
    revalidatePath("/dashboard");

    return result;
  } catch (error) {
    console.error("Error in chat request:", error);
    throw error;
  }
}
