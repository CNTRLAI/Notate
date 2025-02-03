import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Button } from "@/src/components/ui/button";
import { FolderOpenIcon, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useState } from "react";
import AddLocalModel from "./AddLocalModel";
import { Model } from "@/src/types/Models";
import { User } from "next-auth";

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
  const [localModelDir, setLocalModelDir] = useState<string | null>(null);
  const [localModels, setLocalModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [localModalLoading, setLocalModalLoading] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
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
        <Button variant="outline" className="ml-2">
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
