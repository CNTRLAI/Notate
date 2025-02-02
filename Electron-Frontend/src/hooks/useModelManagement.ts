import { useCallback, useState } from "react";

export const useModelManagement = (activeUser: User | null) => {
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(
    []
  );
  const [azureModels, setAzureModels] = useState<AzureModel[]>([]);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [userTools, setUserTools] = useState<UserTool[]>([]);
  const [systemTools, setSystemTools] = useState<Tool[]>([]);
  const fetchOpenRouterModels = useCallback(async () => {
    if (!window.electron || !activeUser) return;
    const models = await window.electron.getOpenRouterModels(activeUser.id);
    setOpenRouterModels(models.models);
  }, [activeUser]);

  const fetchAzureModels = useCallback(async () => {
    if (!window.electron || !activeUser) return;
    const models = await window.electron.getAzureOpenAIModels(activeUser.id);
    setAzureModels(
      models.models.map((m) => ({
        ...m,
        id: m.id,
        deployment: m.model,
        apiKey: m.api_key,
      }))
    );
  }, [activeUser]);

  const fetchTools = useCallback(async () => {
    if (!window.electron || !activeUser) return;

    // First get system tools to have the complete tool information
    const systemToolsResult = await window.electron.getTools();
    const systemTools = systemToolsResult.tools;

    // Then get user tool settings
    const userToolsResult = await window.electron.getUserTools(activeUser.id);
    const userToolSettings = userToolsResult.tools;

    // Join the user tool settings with system tool information
    const completeUserTools = userToolSettings
      .map((userTool) => {
        const systemTool = systemTools.find((st) => st.id === userTool.id);
        if (!systemTool) return null;

        return {
          id: userTool.id,
          name: systemTool.name,
          description: systemTool.description,
          enabled: userTool.enabled,
          docked: Number(userTool.docked),
        };
      })
      .filter((tool): tool is NonNullable<typeof tool> => tool !== null);

    setUserTools(completeUserTools);
  }, [activeUser]);

  const fetchSystemTools = useCallback(async () => {
    if (!window.electron || !activeUser) return;
    const tools = await window.electron.getTools();
    setSystemTools(tools.tools);
  }, [activeUser]);

  const toggleTool = (tool: UserTool) => {
    if (!activeUser) return;
    const existingTool = userTools.find((t) => t.id === tool.id);

    if (existingTool) {
      setUserTools((prev) =>
        prev.map((t) =>
          t.id === tool.id ? { ...t, enabled: t.enabled === 1 ? 0 : 1 } : t
        )
      );
      window.electron.updateUserTool(
        activeUser.id,
        tool.id,
        existingTool.enabled === 1 ? 0 : 1,
        1
      );
    } else {
      setUserTools((prev) => [
        ...prev,
        {
          ...tool,
          enabled: 1,
          docked: 1,
        },
      ]);
      window.electron.updateUserTool(activeUser.id, tool.id, 1, 1);
    }
  };

  const dockTool = (tool: UserTool) => {
    if (!activeUser) return;
    const existingTool = userTools.find((t) => t.name === tool.name);

    if (existingTool) {
      setUserTools((prev) => prev.filter((t) => t.name !== tool.name));
      window.electron.updateUserTool(activeUser.id, tool.id, 0, 0);
    } else {
      const newTool = {
        ...tool,
        enabled: 1,
        docked: 1,
      };
      setUserTools((prev) => [...prev, newTool]);
      window.electron.updateUserTool(activeUser.id, tool.id, 1, 1);
    }
  };

  const fetchCustomModels = useCallback(async () => {
    if (!window.electron || !activeUser) return;
    const models = await window.electron.getCustomAPIs(activeUser.id);
    setCustomModels(models.api);
  }, [activeUser]);

  return {
    openRouterModels,
    setOpenRouterModels,
    azureModels,
    setAzureModels,
    customModels,
    setCustomModels,
    fetchOpenRouterModels,
    fetchAzureModels,
    fetchCustomModels,
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
  };
};
