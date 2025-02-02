import { useEffect, useCallback } from "react";
import { useView } from "@/context/useView";
import { useUser } from "@/context/useUser";
import { useSysSettings } from "@/context/useSysSettings";
import { initializeShiki } from "@/lib/shikiHightlight";
import { useLibrary } from "@/context/useLibrary";
import { fetchEmbeddingModels } from "@/data/models";
import { fetchSystemSpecs } from "@/data/sysSpecs";
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
  const {
    setSettings,
    setUsers,
    setSettingsOpen,
    checkFFMPEG,
    setPlatform,
    fetchSettings,
    setSystemSpecs,
  } = useSysSettings();

  // Initial setup that doesn't depend on activeUser
  useEffect(() => {
    initializeShiki();
    const fetchUsers = async () => {
      if (window.electron && window.electron.getUsers) {
        try {
          const response = await window.electron.getUsers();
          const fetchedUsers = response.users as User[];
          setUsers(fetchedUsers);
          if (fetchedUsers.length === 0) {
            setActiveView("Signup");
          } else {
            setActiveView("SelectAccount");
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          setActiveView("Signup");
        }
      } else {
        console.error("window.electron or getUsers method is not defined");
        setActiveView("Signup");
      }
    };
    const getPlatform = async () => {
      const plat = await window.electron.getPlatform();
      setPlatform(plat.platform);
    };
    getPlatform();
    checkFFMPEG();
    fetchUsers();
    fetchSystemSpecs(setSystemSpecs);
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
    const unsubscribeReset =
      window.electron.subscribeResetUserState(handleResetUserState);
    const unsubscribeView =
      window.electron.subscribeChangeView(handleViewChange);

    return () => {
      unsubscribeReset();
      unsubscribeView();
    };
  }, [handleResetUserState, handleViewChange]);
}
