import db from "../../db.js";

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
  const assistantMessageId = db.addUserMessage(
    activeUser.id,
    Number(conversationId),
    "assistant",
    result.content,
    result.reasoning,
    collectionId ? Number(collectionId) : undefined
  ).lastInsertRowid;
  if (data !== null) {
    db.addRetrievedData(Number(assistantMessageId), JSON.stringify(data));
  }
}
