"use client";

import { useEffect, useCallback } from "react";
import { useUser } from "@/src/context/useUser";
import { useSysSettings } from "@/src/context/useSysSettings";
import { initializeShiki } from "@/src/lib/shikiHighlight";
import { useLibrary } from "@/src/context/useLibrary";
import { fetchEmbeddingModels } from "@/src/data/models";
import { View } from "../types/view";
import { useView } from "../context/useView";

export function useAppInitialization() {
  const { setActiveView } = useView();
  const {
    activeUser,
    setApiKeys,
    setConversations,
    setPrompts,
    setActiveUser,
    handleResetChat,
    setFilteredConversations,
    setIsSearchOpen,
    setSearchTerm,
    fetchDevAPIKeys,
    getUserConversations,
    fetchApiKey,
    fetchPrompts,
    fetchOpenRouterModels,
    fetchAzureModels,
    fetchCustomModels,
    fetchTools,
    fetchSystemTools,
  } = useUser();
  const {
    setUserCollections,
    setSelectedCollection,
    setOpenLibrary,
    setOpenAddToCollection,
    fetchCollections,
    setEmbeddingModels,
  } = useLibrary();
  const { setSettings, setSettingsOpen, checkFFMPEG, fetchSettings } =
    useSysSettings();

  // Initial setup that doesn't depend on activeUser
  useEffect(() => {
    initializeShiki();
    checkFFMPEG();
  }, []);

  // User-dependent initialization
  useEffect(() => {
    if (activeUser) {
      fetchOpenRouterModels();
      fetchSettings(activeUser);
      getUserConversations();
      fetchApiKey();
      fetchPrompts();
      fetchEmbeddingModels(setEmbeddingModels);
      fetchDevAPIKeys();
      fetchCollections();
      fetchAzureModels();
      fetchCustomModels();
      fetchTools();
      fetchSystemTools();
    }
  }, [activeUser]);

  const handleResetUserState = useCallback(() => {
    setActiveUser(null);
    setUserCollections([]);
    setApiKeys([]);
    setConversations([]);
    setPrompts([]);
    setSettings({});
    setSelectedCollection(null);
    setFilteredConversations([]);
    setOpenLibrary(false);
    setOpenAddToCollection(false);
    setIsSearchOpen(false);
    setSearchTerm("");
    setSettingsOpen(false);
    handleResetChat();
  }, [
    setActiveUser,
    setUserCollections,
    setApiKeys,
    setConversations,
    setPrompts,
    setSettings,
    setSelectedCollection,
    setFilteredConversations,
    setOpenLibrary,
    setOpenAddToCollection,
    setIsSearchOpen,
    setSearchTerm,
    setSettingsOpen,
    handleResetChat,
  ]);

  const handleViewChange = useCallback(
    (view: View) => {
      setActiveView(view);
    },
    [setActiveView]
  );

  useEffect(() => {
    /*  const unsubscribeReset =
      window.electron.subscribeResetUserState(handleResetUserState);
    const unsubscribeView =
      window.electron.subscribeChangeView(handleViewChange); */
    /*  return () => {
      unsubscribeReset();
      unsubscribeView();
    }; */
  }, [handleResetUserState, handleViewChange]);
}
