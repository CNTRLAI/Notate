import React, { createContext, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface SysSettingsContextType {
  isOllamaRunning: boolean;
  setIsOllamaRunning: (isOllamaRunning: boolean) => void;
  systemSpecs: {
    cpu: string;
    vram: string;
    GPU_Manufacturer?: string;
  };
  setSystemSpecs: (systemSpecs: {
    cpu: string;
    vram: string;
    GPU_Manufacturer?: string;
  }) => void;
  settingsOpen: boolean;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  platform: "win32" | "darwin" | "linux" | null;
  setPlatform: React.Dispatch<
    React.SetStateAction<"win32" | "darwin" | "linux" | null>
  >;
  sourceType: "local" | "external";
  setSourceType: React.Dispatch<React.SetStateAction<"local" | "external">>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  totalVRAM: number;
  localModels: Model[];
  setLocalModels: React.Dispatch<React.SetStateAction<Model[]>>;
  isRunningModel: boolean;
  setIsRunningModel: React.Dispatch<React.SetStateAction<boolean>>;
  isFFMPEGInstalled: boolean;
  setisFFMPEGInstalled: React.Dispatch<React.SetStateAction<boolean>>;
  localModalLoading: boolean;
  setLocalModalLoading: React.Dispatch<React.SetStateAction<boolean>>;
  progressRef: React.RefObject<HTMLDivElement>;
  progressLocalOutput: string[];
  setProgressLocalOutput: React.Dispatch<React.SetStateAction<string[]>>;
  handleRunOllama: (model: string, activeUser: User) => Promise<void>;
  isMaximized: boolean;
  setIsMaximized: React.Dispatch<React.SetStateAction<boolean>>;
  checkFFMPEG: () => Promise<void>;
  fetchLocalModels: () => Promise<void>;
  fetchSystemSpecs: () => Promise<void>;
  checkOllama: () => Promise<void>;
  maxTokens: number;
  setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
  localModelDir: string;
  setLocalModelDir: React.Dispatch<React.SetStateAction<string>>;
  loadModelsFromDirectory: (dirPath: string) => Promise<void>;
  handleRunModel: (
    model_name: string,
    model_location: string,
    model_type: string,
    user_id: string
  ) => Promise<void>;
  ollamaModels: OllamaModel[];
  setOllamaModels: React.Dispatch<React.SetStateAction<OllamaModel[]>>;
  selectedModel: Model | null;
  setSelectedModel: React.Dispatch<React.SetStateAction<Model | null>>;
  selectedProvider: string;
  setSelectedProvider: React.Dispatch<React.SetStateAction<string>>;
  localModel: string;
  setLocalModel: React.Dispatch<React.SetStateAction<string>>;
  embeddingModels: { name: string }[];
  setEmbeddingModels: React.Dispatch<React.SetStateAction<{ name: string }[]>>;
  fetchEmbeddingModels: () => Promise<void>;
}

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
  const [embeddingModels, setEmbeddingModels] = useState<{ name: string }[]>([]);

  const [systemSpecs, setSystemSpecs] = useState<{
    cpu: string;
    vram: string;
    GPU_Manufacturer?: string;
  }>({
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

  const fetchSystemSpecs = async () => {
    try {
      const { cpu, vram, GPU_Manufacturer } =
        await window.electron.systemSpecs();
      setSystemSpecs({ cpu, vram, GPU_Manufacturer });
    } catch (error) {
      console.error("Error fetching system specs:", error);
      setSystemSpecs({
        cpu: "Unknown",
        vram: "Unknown",
        GPU_Manufacturer: "Unknown",
      });
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
    await window.electron.updateUserSettings(
      Number(user_id),
      "model",
      model_name
    );
    await window.electron.updateUserSettings(
      Number(user_id),
      "provider",
      "Local"
    );
    await window.electron.updateUserSettings(
      Number(user_id),
      "model_type",
      model_type
    );
    await window.electron.updateUserSettings(
      Number(user_id),
      "model_location",
      model_location
    );
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

  const fetchEmbeddingModels = async () => {
    try {
      const result = await window.electron.getEmbeddingsModels();
      if (result && result.models) {
        setEmbeddingModels(result.models);
      }
    } catch (error) {
      console.error("Error fetching embedding models:", error);
      setEmbeddingModels([]);
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
        fetchSystemSpecs,
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
        embeddingModels,
        setEmbeddingModels,
        fetchEmbeddingModels,
      }}
    >
      {children}
    </SysSettingsContext.Provider>
  );
};

export { SysSettingsProvider, SysSettingsContext };
