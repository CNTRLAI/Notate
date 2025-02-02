import React, { createContext, useMemo } from "react";
import { ChatInputContext, ChatInputContextType } from "./ChatInputContext";
import { useChatManagement } from "@/hooks/useChatManagement";
import { useConversationManagement } from "@/hooks/useConversationManagement";
import { useModelManagement } from "@/hooks/useModelManagement";
import { useUIState } from "@/hooks/useUIState";
import { useState, useCallback } from "react";
import { UserContextType } from "@/types/contextTypes/UserContextType";

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [prompts, setPrompts] = useState<UserPrompts[]>([]);
  const [devAPIKeys, setDevAPIKeys] = useState<Keys[]>([]);

  // Initialize conversation management first
  const {
    conversations,
    activeConversation,
    title,
    newConversation,
    getUserConversations,
    setActiveConversation,
    setTitle,
    setNewConversation,
    setConversations,
  } = useConversationManagement(activeUser);

  // Then initialize chat management with the getUserConversations function
  const {
    messages,
    streamingMessage,
    streamingMessageReasoning,
    isLoading,
    error,
    handleChatRequest: baseChatRequest,
    cancelRequest,
    setMessages,
    setStreamingMessage,
    setStreamingMessageReasoning,
    setError,
    currentRequestId,
    setCurrentRequestId,
    setIsLoading,
    input,
    setInput,
    agentActions,
    setAgentActions,
  } = useChatManagement(activeUser, getUserConversations);

  const {
    openRouterModels,
    azureModels,
    customModels,
    fetchOpenRouterModels,
    fetchAzureModels,
    fetchCustomModels,
    setOpenRouterModels,
    setAzureModels,
    setCustomModels,
    tools,
    setTools,
    dockTool,
    fetchTools,
    systemTools,
    setSystemTools,
    fetchSystemTools,
    userTools,
    setUserTools,
    toggleTool,
  } = useModelManagement(activeUser);

  const {
    isSearchOpen,
    setIsSearchOpen,
    searchTerm,
    setSearchTerm,
    searchRef,
    alertForUser,
    setAlertForUser,
  } = useUIState();

  const fetchDevAPIKeys = useCallback(async () => {
    if (activeUser) {
      const keys = await window.electron.getDevAPIKeys(activeUser.id);
      setDevAPIKeys(keys.keys);
    }
  }, [activeUser]);

  const fetchApiKey = useCallback(async () => {
    if (activeUser) {
      const apiKeys = await window.electron.getUserApiKeys(activeUser.id);
      const settings = await window.electron.getUserSettings(activeUser.id);
      if (apiKeys.apiKeys.length === 0 && settings.provider !== "local") {
        setAlertForUser(true);
        return;
      }
      setApiKeys(apiKeys.apiKeys as ApiKey[]);
    }
  }, [activeUser, setAlertForUser]);

  const fetchPrompts = useCallback(async () => {
    if (activeUser) {
      const fetchedPrompts = await window.electron.getUserPrompts(
        activeUser.id
      );
      setPrompts(fetchedPrompts.prompts as UserPrompts[]);
    }
  }, [activeUser]);

  const fetchMessages = useCallback(async () => {
    if (activeConversation) {
      const conversation = conversations.find(
        (conv: Conversation) => conv.id === activeConversation
      );
      if (conversation && activeUser) {
        const newMessages =
          await window.electron.getConversationMessagesWithData(
            activeUser.id,
            conversation.id
          );
        setMessages(newMessages.messages);
      }
    }
  }, [activeConversation, conversations, activeUser, setMessages]);

  const handleResetChat = useCallback(async () => {
    await cancelRequest();
    setMessages([]);
    setStreamingMessage("");
    setStreamingMessageReasoning("");
    setIsLoading(false);
    setActiveConversation(null);
  }, [
    cancelRequest,
    setMessages,
    setStreamingMessage,
    setStreamingMessageReasoning,
    setActiveConversation,
    setIsLoading,
  ]);

  // Memoize chat input related values
  const chatInputValue = useMemo<ChatInputContextType>(
    () => ({
      input,
      setInput,
      isLoading,
      setIsLoading,
      handleChatRequest: baseChatRequest,
      cancelRequest,
    }),
    [input, setInput, isLoading, setIsLoading, baseChatRequest, cancelRequest]
  );

  // Memoize the main context value
  const contextValue = useMemo<UserContextType>(
    () => ({
      activeUser,
      setActiveUser,
      apiKeys,
      setApiKeys,
      activeConversation,
      setActiveConversation,
      conversations,
      setConversations,
      prompts,
      setPrompts,
      filteredConversations,
      setFilteredConversations,
      isSearchOpen,
      setIsSearchOpen,
      searchTerm,
      setSearchTerm,
      searchRef,
      messages,
      setMessages,
      newConversation,
      setNewConversation,
      title,
      setTitle,
      streamingMessage,
      setStreamingMessage,
      handleResetChat,
      devAPIKeys,
      setDevAPIKeys,
      fetchDevAPIKeys,
      getUserConversations,
      alertForUser,
      setAlertForUser,
      fetchApiKey,
      fetchPrompts,
      fetchMessages,
      error,
      setError,
      currentRequestId,
      setCurrentRequestId,
      openRouterModels,
      setOpenRouterModels,
      apiKeyInput,
      setApiKeyInput,
      azureModels,
      setAzureModels,
      customModels,
      setCustomModels,
      fetchOpenRouterModels,
      fetchAzureModels,
      fetchCustomModels,
      streamingMessageReasoning,
      setStreamingMessageReasoning,
      agentActions,
      setAgentActions,
      tools,
      setTools,
      dockTool,
      fetchTools,
      systemTools,
      setSystemTools,
      fetchSystemTools,
      userTools,
      setUserTools,
      toggleTool,
    }),
    [
      activeUser,
      apiKeys,
      activeConversation,
      conversations,
      prompts,
      filteredConversations,
      isSearchOpen,
      searchTerm,
      searchRef,
      messages,
      newConversation,
      title,
      streamingMessage,
      handleResetChat,
      devAPIKeys,
      fetchDevAPIKeys,
      getUserConversations,
      alertForUser,
      fetchApiKey,
      fetchPrompts,
      fetchMessages,
      error,
      currentRequestId,
      openRouterModels,
      apiKeyInput,
      azureModels,
      customModels,
      fetchOpenRouterModels,
      fetchAzureModels,
      fetchCustomModels,
      streamingMessageReasoning,
      setActiveConversation,
      setAlertForUser,
      setCurrentRequestId,
      setError,
      setIsSearchOpen,
      setMessages,
      setNewConversation,
      setSearchTerm,
      setStreamingMessage,
      setStreamingMessageReasoning,
      setTitle,
      setConversations,
      setOpenRouterModels,
      setAzureModels,
      setCustomModels,
      setAgentActions,
      agentActions,
      tools,
      setTools,
      dockTool,
      fetchTools,
      systemTools,
      setSystemTools,
      fetchSystemTools,
      userTools,
      setUserTools,
      toggleTool,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>
      <ChatInputContext.Provider value={chatInputValue}>
        {children}
      </ChatInputContext.Provider>
    </UserContext.Provider>
  );
};

export { UserProvider, UserContext };
