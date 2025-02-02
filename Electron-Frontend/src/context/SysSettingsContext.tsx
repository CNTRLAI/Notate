import React, { createContext, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { SysSettingsContextType } from "@/types/contextTypes/SystemSettingsTypes";
import { SystemSpecs } from "@/data/sysSpecs";

const SysSettingsContext = createContext<SysSettingsContextType | undefined>(
  undefined
);

const SysSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [localModel, setLocalModel] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [localModelDir, setLocalModelDir] = useState<string>("");
  const [localModels, setLocalModels] = useState<Model[]>([]);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState<boolean>(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>({});
  const [users, setUsers] = useState<User[]>([]);
  const [ollamaInit, setOllamaInit] = useState<boolean>(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isRunningModel, setIsRunningModel] = useState(false);
  const [isFFMPEGInstalled, setisFFMPEGInstalled] = useState(false);
  const [localModalLoading, setLocalModalLoading] = useState(false);
  const [progressLocalOutput, setProgressLocalOutput] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<"local" | "external">(
    "external"
  );
  const [platform, setPlatform] = useState<"win32" | "darwin" | "linux" | null>(
    null
  );

  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs>({
    cpu: "Unknown",
    vram: "Unknown",
    GPU_Manufacturer: "Unknown",
  });

  const totalVRAM = parseInt(systemSpecs.vram);
  const [maxTokens, setMaxTokens] = useState(4096);

  const checkFFMPEG = async () => {
    try {
      const result = await window.electron.checkIfFFMPEGInstalled();
      if (result && typeof result.success === "boolean") {
        setisFFMPEGInstalled(result.success);
      } else {
        console.error("Invalid FFMPEG check result:", result);
        setisFFMPEGInstalled(false);
      }
    } catch (error) {
      console.error("Error checking FFMPEG:", error);
      setisFFMPEGInstalled(false);
    }
  };

  const handleOllamaIntegration = async (activeUser: User) => {
    const startUpOllama = await window.electron.checkOllama();
    if (activeUser && startUpOllama) {
      const models = await window.electron.fetchOllamaModels();
      const filteredModels = (models.models as unknown as string[])
        .filter((model) => !model.includes("granite"))
        .map((model) => ({ name: model, type: "ollama" }));
      await window.electron.updateUserSettings({
        userId: activeUser.id,
        ollamaIntegration: 1,
      });
      setOllamaInit(true);
      setOllamaModels(filteredModels);
    }
  };
  const handleRunModel = async (
    model_name: string,
    model_location: string,
    model_type: string,
    user_id: string
  ) => {
    setLocalModalLoading(true);
    const result = (await window.electron.loadModel({
      model_location: model_location,
      model_name: model_name,
      model_type: model_type,
      user_id: Number(user_id),
    })) as unknown as { status: string };
    setSettings((prev) => ({
      ...prev,
      model: model_name,
      provider: "local",
    }));
    await window.electron.updateUserSettings({
      userId: Number(user_id),
      model: model_name,
      provider: "local",
      modelType: model_type,
      modelLocation: model_location,
    });

    if (result.status === "success") {
      toast({
        title: "Model loaded",
        description: `Loaded ${model_name}`,
      });
      setLocalModalLoading(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to load model",
        variant: "destructive",
      });
      setLocalModalLoading(false);
    }
  };

  const checkOllama = async () => {
    const { isOllamaRunning } = await window.electron.checkOllama();
    setIsOllamaRunning(isOllamaRunning);
    if (isOllamaRunning) {
      fetchLocalModels();
    }
  };

  const fetchLocalModels = async () => {
    try {
      const data = (await window.electron.getDirModels(
        localModelDir
      )) as unknown as {
        dirPath: string;
        models: Model[];
      };

      setLocalModels(
        Array.isArray(data.models)
          ? data.models.map((model: string | Model) => ({
              name: typeof model === "string" ? model : model.name || "",
              type: typeof model === "string" ? "" : model.type || "",
              model_location:
                typeof model === "string" ? "" : model.model_location || "",
              modified_at:
                typeof model === "string" ? "" : model.modified_at || "",
              size: typeof model === "string" ? 0 : model.size || 0,
              digest: typeof model === "string" ? "" : model.digest || "",
            }))
          : []
      );
    } catch (error) {
      console.error("Error fetching local models:", error);
    }
  };

  const handleRunOllama = async (model: string, activeUser: User) => {
    if (!model) {
      toast({
        title: "Error",
        description: "Please select a model first",
        variant: "destructive",
      });
      return;
    }
    setLocalModalLoading(true);
    setProgressLocalOutput([]);
    await window.electron.updateUserSettings({
      userId: activeUser.id,
      ollamaModel: model,
    });
    try {
      const result = await window.electron.runOllama(model, activeUser);

      if (!result.success && result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Started Ollama with model: ${model}`,
      });

      setSettings((prev) => ({
        ...prev,
        provider: "Ollama",
        model: model,
      }));
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start Ollama",
        variant: "destructive",
      });
    } finally {
      setLocalModalLoading(false);
    }
  };
  const fetchSettings = async (activeUser: User) => {
    if (activeUser) {
      const settings = await window.electron.getUserSettings(activeUser.id);
      if (parseInt(settings?.ollamaIntegration?.toString() ?? "0") === 1) {
        handleOllamaIntegration(activeUser);
      }
      setSettings(settings);
      if (settings.modelDirectory) {
        setLocalModelDir(settings.modelDirectory);
        const models = (await window.electron.getDirModels(
          settings.modelDirectory
        )) as unknown as { dirPath: string; models: Model[] };
        setLocalModels(models.models);
        if (
          settings.provider === "local" &&
          settings.model &&
          settings.modelType
        ) {
          await window.electron.loadModel({
            model_location: settings.modelLocation as string,
            model_name: settings.model,
            model_type: settings.modelType as string,
            user_id: activeUser.id,
          });
        }
      }
    }
  };

  const loadModelsFromDirectory = async (dirPath: string) => {
    try {
      const models = await window.electron.getDirModels(dirPath);
      if (!Array.isArray(models)) {
        throw new Error("Invalid response from getDirModels - expected array");
      }

      // Convert the models array to the OllamaModel format
      const formattedModels: Model[] = models.map((modelName: string) => ({
        name: modelName,
        type: "",
        model_location: "",
        modified_at: "", // These fields might not be available for local models
        size: 0,
        digest: "",
      }));

      setLocalModels(formattedModels);
      setLocalModelDir(dirPath);

      toast({
        title: "Models Loaded",
        description: `Found ${formattedModels.length} models in directory`,
      });
    } catch (error) {
      console.error("Error loading models from directory:", error);
      toast({
        title: "Error",
        description: "Failed to load models from directory",
        variant: "destructive",
      });
    }
  };

  return (
    <SysSettingsContext.Provider
      value={{
        isOllamaRunning,
        setIsOllamaRunning,
        systemSpecs,
        setSystemSpecs,
        totalVRAM,
        settingsOpen,
        setSettingsOpen,
        settings,
        setSettings,
        platform,
        setPlatform,
        sourceType,
        setSourceType,
        users,
        setUsers,
        localModels,
        setLocalModels,
        isRunningModel,
        setIsRunningModel,
        isFFMPEGInstalled,
        setisFFMPEGInstalled,
        localModalLoading,
        setLocalModalLoading,
        progressRef,
        progressLocalOutput,
        setProgressLocalOutput,
        handleRunOllama,
        isMaximized,
        setIsMaximized,
        checkFFMPEG,
        fetchLocalModels,
        checkOllama,
        maxTokens,
        setMaxTokens,
        localModelDir,
        setLocalModelDir,
        loadModelsFromDirectory,
        handleRunModel,
        ollamaModels,
        setOllamaModels,
        selectedModel,
        setSelectedModel,
        selectedProvider,
        setSelectedProvider,
        localModel,
        setLocalModel,
        fetchSettings,
        handleOllamaIntegration,
        ollamaInit,
        setOllamaInit,
      }}
    >
      {children}
    </SysSettingsContext.Provider>
  );
};

export { SysSettingsProvider, SysSettingsContext };
