import { useCallback, useState } from "react";
import { AzureModel, CustomModel, OpenRouterModel } from "../types/Models";
import { User } from "next-auth";
import { UserTool, Tool } from "../types/tools";
import {
  getAzureOpenAIModels,
  getCustomModels,
  getOpenRouterModels,
} from "../data/models";
import { getSystemTools, updateUserTool, createUserTool } from "../data/tools";

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
    if (!activeUser?.id || activeUser.id === undefined) return;
    const models = await getOpenRouterModels(Number(activeUser.id));
    setOpenRouterModels(models.map((m) => m.model));
  }, [activeUser]);

  const fetchAzureModels = useCallback(async () => {
    if (!activeUser?.id || activeUser.id === undefined) return;
    const models = await getAzureOpenAIModels(Number(activeUser.id));
    setAzureModels(
      models.map((m) => ({
        ...m,
        id: m.id,
        deployment: m.model,
        apiKey: m.api_key,
      }))
    );
  }, [activeUser]);

  const fetchTools = useCallback(async () => {
    if (!activeUser) return;

    // First get system tools to have the complete tool information
    const systemToolsResult = {
      tools: [
        {
          id: 1,
          name: "Tool 1",
          description: "Tool 1 description",
        },
      ],
    };
    const systemTools = systemToolsResult.tools;

    // Then get user tool settings
    const userToolsResult = {
      tools: [
        {
          id: 1,
          name: "Tool 1",
          description: "Tool 1 description",
          enabled: 1,
          docked: 1,
        },
      ],
    };
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
    if (!activeUser) return;
    const tools = await getSystemTools();
    setSystemTools(tools);
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
      updateUserTool(
        Number(activeUser.id),
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
      createUserTool(Number(activeUser.id), tool.id);
    }
  };

  const dockTool = (tool: UserTool) => {
    if (!activeUser) return;
    const existingTool = userTools.find((t) => t.name === tool.name);

    if (existingTool) {
      setUserTools((prev) => prev.filter((t) => t.name !== tool.name));
      updateUserTool(Number(activeUser.id), tool.id, 0, 0);
    } else {
      const newTool = {
        ...tool,
        enabled: 1,
        docked: 1,
      };
      setUserTools((prev) => [...prev, newTool]);
      createUserTool(Number(activeUser.id), tool.id);
    }
  };

  const fetchCustomModels = useCallback(async () => {
    if (!activeUser) return;
    const models = await getCustomModels(Number(activeUser.id));
    setCustomModels(models.map((model) => ({ ...model, api_key: "" })));
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
