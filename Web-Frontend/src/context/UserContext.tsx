"use client";
import React, { createContext, useMemo } from "react";
import { ChatInputContext, ChatInputContextType } from "./ChatInputContext";
import { useChatManagement } from "@/src/hooks/useChatManagement";
import { useConversationManagement } from "@/src/hooks/useConversationManagement";
import { useModelManagement } from "@/src/hooks/useModelManagement";
import { useUIState } from "@/src/hooks/useUIState";
import { useState, useCallback } from "react";
import { UserContextType } from "@/src/types/ContextTypes/UserContextType";
import { ApiKey, DevApiKey } from "../types/apiKeys";
import { Conversation } from "../types/convo";
import { UserPrompts } from "../types/prompts";
import { getDevApiKeys } from "@/src/data/devapi";
import { getSettingById } from "../data/settings";
import { getApiKeys } from "../data/apiKeys";
import { getPrompts } from "@/src/data/prompt";
import { getConversationMessagesWithData } from "@/src/data/conversations";
import { Message } from "@/src/types/messages";
import { useSession } from "next-auth/react";
import { User } from "next-auth";

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const session = useSession();
  const activeUser = session.data?.user as User | null;
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [prompts, setPrompts] = useState<UserPrompts[]>([]);
  const [devAPIKeys, setDevAPIKeys] = useState<DevApiKey[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

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
    setMessages,
    setStreamingMessage,
    setStreamingMessageReasoning,
    setError,
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
      const keys = await getDevApiKeys(Number(activeUser.id));
      console.log(keys);
      setDevAPIKeys(keys as DevApiKey[]);
    }
  }, [activeUser]);

  const fetchApiKey = useCallback(async () => {
    if (activeUser) {
      const apiKeys = await getApiKeys(Number(activeUser.id));
      const settings = await getSettingById(Number(activeUser.id));
      if (apiKeys.length === 0 && settings?.provider !== "local") {
        setAlertForUser(true);
        return;
      }
      setApiKeys(apiKeys as ApiKey[]);
    }
  }, [activeUser, setAlertForUser]);

  const fetchPrompts = useCallback(async () => {
    if (activeUser) {
      const fetchedPrompts = await getPrompts(Number(activeUser.id));
      setPrompts(fetchedPrompts as UserPrompts[]);
    }
  }, [activeUser]);

  const fetchMessages = useCallback(async () => {
    if (activeConversation) {
      const conversation = conversations.find(
        (conv: Conversation) => conv.id === activeConversation
      );
      if (conversation && activeUser) {
        const newMessages = await getConversationMessagesWithData(
          Number(activeUser.id),
          conversation.id
        );
        setMessages(newMessages.messages as Message[]);
      }
    }
  }, [activeConversation, conversations, activeUser, setMessages]);

  const handleResetChat = useCallback(async () => {
    setMessages([]);
    setStreamingMessage("");
    setStreamingMessageReasoning("");
    setIsLoading(false);
    setActiveConversation(null);
  }, [
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
    }),
    [input, setInput, isLoading, setIsLoading, baseChatRequest]
  );

  // Memoize the main context value
  const contextValue = useMemo<UserContextType>(
    () => ({
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
      openRouterModels,
      setOpenRouterModels,
      apiKeyInput,
      setApiKeyInput,
      azureModels,
      setAzureModels,
      customModels,
      setCustomModels,
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
      activeUser,
      currentRequestId,
      setCurrentRequestId,
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
      openRouterModels,
      apiKeyInput,
      azureModels,
      customModels,
      fetchAzureModels,
      fetchCustomModels,
      streamingMessageReasoning,
      setActiveConversation,
      setAlertForUser,
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
      currentRequestId,
      setCurrentRequestId,
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
