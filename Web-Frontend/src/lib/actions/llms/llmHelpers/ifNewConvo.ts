import db from "@/src/lib/db";
import { generateTitle } from "../generateTitle";
import { User } from "@/src/types/user";
import { Message } from "@/src/types/messages";

export async function ifNewConversation(messages: Message[], activeUser: User) {
  try {
    const newTitle = await generateTitle(
      messages[messages.length - 1].content,
      activeUser
    );

    const addConversation = await db.conversations.create({
      data: {
        user_id: activeUser.id,
        title: newTitle,
      },
    });
    return { cId: addConversation.id, title: newTitle };
  } catch (error) {
    console.error("Error in ifNewConversation:", error);
    return { conversationId: null, title: null };
  }
}
