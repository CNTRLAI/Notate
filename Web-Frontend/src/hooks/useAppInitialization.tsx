"use client";

import { useEffect } from "react";
import { useUser } from "@/src/context/useUser";
import { useSysSettings } from "@/src/context/useSysSettings";
import { initializeShiki } from "@/src/lib/shikiHighlight";
import { useLibrary } from "@/src/context/useLibrary";
import { fetchEmbeddingModels } from "@/src/data/models";

export function useAppInitialization() {
  const {
    activeUser,
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
  const { fetchCollections, setEmbeddingModels } = useLibrary();
  const { fetchSettings } = useSysSettings();

  // Initial setup that doesn't depend on activeUser
  useEffect(() => {
    initializeShiki();
  }, []);

  // User-dependent initialization
  useEffect(() => {
    if (activeUser) {
      fetchOpenRouterModels();
      fetchSettings(Number(activeUser.id));
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
}
