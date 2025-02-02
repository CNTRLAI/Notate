import { SystemSpecs } from "@/data/sysSpecs";

export interface SysSettingsContextType {
  ollamaInit: boolean;
  setOllamaInit: React.Dispatch<React.SetStateAction<boolean>>;
  isOllamaRunning: boolean;
  setIsOllamaRunning: (isOllamaRunning: boolean) => void;
  systemSpecs: SystemSpecs;
  setSystemSpecs: React.Dispatch<React.SetStateAction<SystemSpecs>>;
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
  checkOllama: () => Promise<void>;
  maxTokens: number;
  setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
  localModelDir: string;
  setLocalModelDir: React.Dispatch<React.SetStateAction<string>>;
  loadModelsFromDirectory: (dirPath: string) => Promise<void>;
  fetchSettings: (activeUser: User) => Promise<void>;
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
  handleOllamaIntegration: (activeUser: User) => Promise<void>;
}
