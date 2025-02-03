"use server";

import db from "@/src/lib/db";
import { Conversation } from "@/src/types/convo";

export const getConversations = async () => {
  const conversations = await db.conversations.findMany();
  return conversations;
};

export const createConversation = async (
  conversation: Conversation,
  user_id: number
) => {
  const newConversation = await db.conversations.create({
    data: {
      ...conversation,
      user_id: user_id,
    },
  });
  return newConversation;
};

export const deleteConversation = async (id: number) => {
  const deletedConversation = await db.conversations.delete({
    where: { id },
  });
  return deletedConversation;
};

export const getConversationById = async (id: number) => {
  const conversation = await db.conversations.findUnique({
    where: { id },
  });
  return conversation;
};

export const getConversationsByUserId = async (user_id: number) => {
  const conversations = await db.conversations.findMany({
    where: { user_id },
  });
  return conversations;
};

export const getConversationMessagesWithData = async (
  conversation_id: number,
  user_id: number
) => {
  const conversation = await db.conversations.findUnique({
    where: {
      id: conversation_id,
      user_id: user_id,
    },
  });

  const messages = await db.messages.findMany({
    where: {
      conversation_id,
      user_id,
    },
    include: {
      retrieved_data: true,
    },
  });

  return { conversation, messages };
};
