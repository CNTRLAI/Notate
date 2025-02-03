"use server";

import db from "@/src/lib/db";
import { Message } from "@/src/types/messages";

export const getMessages = async () => {
  const messages = await db.messages.findMany();
  return messages;
};

export const getMessagesByConversationId = async (conversation_id: number) => {
  const messages = await db.messages.findMany({
    where: { conversation_id },
  });
  return messages;
};

export const createMessage = async (
  message: Message,
  user_id: number,
  conversation_id: number
) => {
  const newMessage = await db.messages.create({
    data: {
      ...message,
      user_id: user_id,
      conversation_id: conversation_id,
    },
  });
  return newMessage;
};

export const deleteMessage = async (id: number) => {
  const deletedMessage = await db.messages.delete({
    where: { id },
  });
  return deletedMessage;
};
