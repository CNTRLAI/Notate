import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Download, HelpCircle, Loader2, X } from "lucide-react";
import { Progress } from "@/src/components/ui/progress";

export default function AddOllamaModel() {
  const [progressMessage, setProgressMessage] = useState("");
  const [currentFile, setCurrentFile] = useState<string>();
  const [fileProgress, setFileProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [ollamaModel, setOllamaModel] = useState("");
  const [localModalLoading, setLocalModalLoading] = useState(false);
  // TODO:   Add in Token for Huggingface private model downloads
  return (
    <div className="text-xs text-muted-foreground">
      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex flex-row gap-2 items-center">
                <HelpCircle className="w-4 h-4" />
                <Input
                  className="w-full"
                  placeholder="Enter model ID (e.g. TheBloke/Mistral-7B-v0.1-GGUF)"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                />
              </TooltipTrigger>
              <TooltipContent>
                Enter a Ollama model ID (e.g. TheBloke/Mistral-7B-v0.1-GGUF).
                <br />
                Hugging Face models can be used by prefixing the model ID <br />
                with &quot;hf.co/&quot; (e.g.
                hf.co/TheBloke/Mistral-7B-v0.1-GGUF).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {progressMessage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-foreground">
                {progressMessage}
              </p>
              {isDownloading && (
                <Button variant="destructive" size="sm" className="h-6 px-2">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {currentFile && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {currentFile}
                  </p>
                  <p className="text-xs text-muted-foreground ml-2">
                    {fileProgress}%
                  </p>
                </div>
                <Progress value={fileProgress} className="h-1" />
                <div className="flex justify-between text-xs text-muted-foreground"></div>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Progress</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-1" />
            </div>
          </div>
        )}
      </div>
      {localModalLoading ?? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Downloading Model...</span>
        </div>
      )}
      <div className="w-full flex flex-row gap-2 pt-2">
        <Button
          variant="secondary"
          className="w-full"
          disabled={localModalLoading}
        >
          {localModalLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download Model
            </div>
          )}
        </Button>
      </div>
      <div className="w-full flex flex-row gap-2 justify-end pt-1">
        <a
          href="https://ollama.ai/models"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Browse models on Ollama →
        </a>
      </div>
      <div className="w-full flex flex-row gap-2 justify-end pt-1">
        <a
          href="https://huggingface.co/models?pipeline_tag=text-generation&sort=trending"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Browse models on Hugging Face →
        </a>
      </div>
    </div>
  );
}
