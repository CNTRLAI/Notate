import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FolderOpenIcon, Loader2 } from "lucide-react";
import { useSysSettings } from "@/context/useSysSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/useUser";
import { toast } from "@/hooks/use-toast";
import AddLocalModel from "./AddLocalModel";

const formatDirectoryPath = (path: string | null) => {
  if (!path) return "Not set";
  const parts = path.split("/");
  const lastTwoParts = parts.slice(-2);
  return `.../${lastTwoParts.join("/")}`;
};

const formatModelName = (name: string) => {
  const parts = name.split("-");
  if (parts.length <= 2) return name;
  return `${parts[0]}-${parts[1]}...`;
};

export default function LocalLLM() {
  const { activeUser } = useUser();
  const {
    localModelDir,
    localModels,
    handleRunModel,
    localModalLoading,
    setLocalModelDir,
    setLocalModels,
    setSelectedModel,
    selectedModel,
  } = useSysSettings();

  const handleSelectDirectory = async () => {
    try {
      if (!activeUser) return;
      const dirPath = await window.electron.openDirectory();
      if (dirPath) {
        setLocalModelDir(dirPath);
        window.electron.updateUserSettings({
          userId: activeUser.id,
          modelDirectory: dirPath,
        });
        const response = (await window.electron.getDirModels(
          dirPath
        )) as unknown as { dirPath: string; models: Model[] };
        setLocalModels(response.models);
        toast({
          title: "Directory selected",
          description: `Selected directory: ${dirPath}`,
        });
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      toast({
        title: "Error",
        description: "Failed to select directory",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <p className="truncate flex-1">
                {formatDirectoryPath(localModelDir)}
              </p>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-[300px] break-all"
            >
              <p>{localModelDir || "No directory selected"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          onClick={handleSelectDirectory}
          variant="outline"
          className="ml-2"
        >
          <FolderOpenIcon className="w-4 h-4 mr-2" />
          Select Directory
        </Button>
      </div>
      <div className="w-full flex flex-row gap-2">
        <Select
          value={selectedModel?.name}
          onValueChange={(value) =>
            setSelectedModel(localModels.find((m) => m.name === value) || null)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a local model" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(localModels) &&
              localModels.map((model) => (
                <SelectItem key={model.digest || model.name} value={model.name}>
                  {formatModelName(model.name)} ({model.type})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          disabled={!selectedModel}
          variant="secondary"
          onClick={() => {
            if (!activeUser || !selectedModel) return;
            const type = selectedModel.type;
            const model = selectedModel.name;
            const user_id = activeUser.id.toString();
            const model_location = selectedModel.model_location;
            handleRunModel(model, model_location, type, user_id);
          }}
        >
          {localModalLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            "Run"
          )}
        </Button>
      </div>

      <AddLocalModel />
    </div>
  );
}
