import db from "../../db.js";

export async function addUserMessage(
  activeUser: User,
  conversationId: number,
  messages: Message[]
) {
  db.addUserMessage(
    activeUser.id,
    Number(conversationId),
    "user",
    messages[messages.length - 1].content
  );
}
