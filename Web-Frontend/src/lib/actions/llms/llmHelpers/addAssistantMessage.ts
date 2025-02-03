import { User } from "@/src/types/user";
import db from "@/src/lib/db";
import { ProviderResponse } from "@/src/types/providers";

export async function addAssistantMessage(
  activeUser: User,
  conversationId: bigint | number,
  result: ProviderResponse,
  collectionId?: number,
  data?: {
    top_k: number;
    results: {
      content: string;
      metadata: string;
    }[];
  } | null
) {
  const assistantMessage = await db.messages.create({
    data: {
      user_id: activeUser.id,
      conversation_id: Number(conversationId),
      role: "assistant",
      content: result.content,
      reasoning_content: result.reasoning,
      collection_id: collectionId ? Number(collectionId) : undefined,
    },
  });
  if (data !== null) {
    db.retrieved_data.create({
      data: {
        message_id: assistantMessage.id,
        data_content: JSON.stringify(data),
      },
    });
  }
}
