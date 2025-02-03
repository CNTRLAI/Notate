import { User } from "@/src/types/user";
import db from "@/src/lib/db";
import { Message } from "@/src/types/messages";

export async function addUserMessage(
  activeUser: User,
  conversationId: number,
  messages: Message[]
) {
  const userMessage = await db.messages.create({
    data: {
      user_id: activeUser.id,
      conversation_id: Number(conversationId),
      role: "user",
      content: messages[messages.length - 1].content,
    },
  });
  return userMessage.id;
}
