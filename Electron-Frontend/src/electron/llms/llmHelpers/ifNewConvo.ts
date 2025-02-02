import log from "electron-log";
import db from "../../db.js";
import { generateTitle } from "../generateTitle.js";

export async function ifNewConversation(messages: Message[], activeUser: User) {
  try {
    const newTitle = await generateTitle(
      messages[messages.length - 1].content,
      activeUser
    );

    const addConversation = await db.addUserConversation(
      activeUser.id,
      newTitle
    );
    return { cId: addConversation.id, title: newTitle };
  } catch (error) {
    log.error("Error in ifNewConversation:", error);
    return { conversationId: null, title: null };
  }
}
