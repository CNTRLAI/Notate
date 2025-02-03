"use client";

import { SearchIcon, Search } from "lucide-react";
import { useUser } from "@/src/context/useUser";
import { useEffect, useState, useCallback } from "react";
import { useView } from "@/src/context/useView";
import { Conversation } from "@/src/types/convo";

type ConversationWithTimestamp = Conversation & {
  latestMessageTime: number;
};

export default function SearchComponent() {
  const {
    setActiveConversation,
    filteredConversations,
    isSearchOpen,
    setIsSearchOpen,
    searchTerm,
    setSearchTerm,
    searchRef,
    conversations,
    activeUser,
    setMessages,
  } = useUser();

  const { activeView, setActiveView } = useView();
  const [sortedConversations, setSortedConversations] = useState<
    ConversationWithTimestamp[]
  >([]);

  const sortConversationsByLatestMessage = useCallback(async () => {
    if (!activeUser?.id) return;

    const conversationsWithTimestamp = await Promise.all(
      conversations.map(async (conv) => {
        return {
          ...conv,
          latestMessageTime: conv.created_at ? new Date(conv.created_at).getTime() : 0,
        };
      })
    );

    // Sort conversations by latest message timestamp
    const sorted = conversationsWithTimestamp.sort(
      (a, b) => b.latestMessageTime - a.latestMessageTime
    );
    setSortedConversations(sorted);
  }, [activeUser?.id, conversations]);

  // Update sorted conversations whenever conversations change
  useEffect(() => {
    sortConversationsByLatestMessage();
  }, [sortConversationsByLatestMessage]);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setSearchTerm("");
  };

  const handleConversationClick = (conversationId: number) => {
    setActiveConversation(conversationId);
    if (activeView !== "Chat") {
      setActiveView("Chat");
    }
    setIsSearchOpen(false);
    setSearchTerm("");
    const conversation = conversations.find(
      (conv) => conv.id === conversationId
    );
    if (conversation && activeUser?.id) {
      /*       window.electron
        .getConversationMessagesWithData(
          activeUser.id,
          conversationId,
          undefined
        )
        .then((result) => {
          setMessages(result.messages);
        }); */
      setMessages([]);
    }
  };

  // Use sorted conversations when no search term, otherwise use filtered
  const displayedConversations =
    searchTerm.trim() === "" ? sortedConversations : filteredConversations;

  return (
    <div className="flex justify-center items-center">
      <div
        ref={searchRef}
        className="clickable-header-section outer-glow flex justify-center items-center border-2 box-shadow-inner rounded-[6px] w-[90%] rounded hover:bg-secondary/50 relative"
        onClick={toggleSearch}
      >
        {isSearchOpen ? (
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              className="px-2 w-full bg-transparent text-sm text-gray-300 outline-none"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={14}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300"
            />
            {isSearchOpen && (
              <div className="absolute top-full left-0 w-full bg-secondary/90 rounded-b-[6px] max-h-60 overflow-x-hidden overflow-y-auto z-50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded">
                {displayedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="px-2 py-1 hover:bg-secondary/50 cursor-pointer text-sm text-gray-300"
                    onClick={() => handleConversationClick(conv.id)}
                  >
                    {conv.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h1 className="text-sm text-gray-300 flex items-center gap-2 px-4">
            <SearchIcon size={14} /> Notate
          </h1>
        )}
      </div>
    </div>
  );
}
