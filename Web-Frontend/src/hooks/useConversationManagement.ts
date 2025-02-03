import { useCallback, useState } from "react";
import { Conversation } from "../types/convo";
import { User } from "next-auth";

export const useConversationManagement = (activeUser: User | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(
    null
  );
  const [title, setTitle] = useState<string | null>(null);
  const [newConversation, setNewConversation] = useState<boolean>(true);

  const getUserConversations = useCallback(async () => {
    /* F */
  }, [activeUser]);

  return {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    title,
    setTitle,
    newConversation,
    setNewConversation,
    getUserConversations,
  };
};
