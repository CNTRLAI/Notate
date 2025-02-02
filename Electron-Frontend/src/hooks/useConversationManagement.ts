import { useCallback, useState } from "react";

export const useConversationManagement = (activeUser: User | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(
    null
  );
  const [title, setTitle] = useState<string | null>(null);
  const [newConversation, setNewConversation] = useState<boolean>(true);

  const getUserConversations = useCallback(async () => {
    if (!window.electron || !activeUser) return;
    const conversations = await window.electron.getUserConversations(
      activeUser.id
    );
    if (conversations?.conversations) {
      setConversations(conversations.conversations);
    }
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
