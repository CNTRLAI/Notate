import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSysSettings } from "@/context/useSysSettings";
import { useUser } from "@/context/useUser";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, HelpCircle, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AddOllamaModel() {
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgressData>({
      message: "",
      totalProgress: 0,
    });
  const [progressMessage, setProgressMessage] = useState("");
  const [currentFile, setCurrentFile] = useState<string>();
  const [fileProgress, setFileProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [ollamaModel, setOllamaModel] = useState("");
  const { activeUser } = useUser();
  const {
    setLocalModalLoading,
    localModalLoading,
    setOllamaModels,
    ollamaModels,
  } = useSysSettings();

  useEffect(() => {
    const handleProgress = (
      _: Electron.IpcRendererEvent,
      message: string | OllamaProgressEvent | DownloadModelProgress
    ) => {
      if (
        typeof message === "object" &&
        "type" in message &&
        message.type === "progress"
      ) {
        const {
          message: progressMessage,
          fileName,
          fileProgress,
          totalProgress,
          ...rest
        } = message.data;
        setProgressMessage(progressMessage);
        setDownloadProgress({
          message: progressMessage,
          totalProgress,
          ...rest,
        });
        if (fileName) setCurrentFile(fileName);
        if (typeof fileProgress === "number") setFileProgress(fileProgress);
      }
    };

    window.electron.removeListener("download-model-progress", handleProgress);
    window.electron.on("download-model-progress", handleProgress);

    return () => {
      window.electron.removeListener("download-model-progress", handleProgress);
    };
  }, []);

  const handleCancel = async () => {
    try {
      const result = await window.electron.cancelDownload();
      if (result.success) {
        toast({
          title: "Download cancelled",
          description: "Model download was cancelled successfully",
        });
      }
    } catch (error) {
      console.error("Error cancelling download:", error);
    } finally {
      setIsDownloading(false);
      setLocalModalLoading(false);
      setDownloadProgress({ message: "", totalProgress: 0 });
      setFileProgress(0);
      setProgressMessage("");
      setCurrentFile(undefined);
    }
  };

  const handleDownload = async () => {
    if (ollamaModel.length === 0) {
      toast({
        title: "Invalid Model",
        description: "Please enter a valid model ID",
        variant: "destructive",
      });
      return;
    }
    if (!activeUser) {
      toast({
        title: "Invalid User",
        description: "Please login to download models",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloading(true);
      setLocalModalLoading(true);
      setDownloadProgress({
        message: "Starting download...",
        totalProgress: 0,
      });
      setFileProgress(0);
      setCurrentFile(undefined);
      try {
        await window.electron.pullModel(ollamaModel);
        setOllamaModels([
          ...ollamaModels,
          { name: ollamaModel, type: "ollama" },
        ]);
      } catch (error) {
        console.error("Error downloading model:", error);
      }
    } catch (error) {
      toast({
        title: "Error downloading model",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setLocalModalLoading(false);
      setDownloadProgress({ message: "", totalProgress: 0 });
      setFileProgress(0);
      setProgressMessage("");
      setCurrentFile(undefined);
    }
  };

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
                with "hf.co/" (e.g. hf.co/TheBloke/Mistral-7B-v0.1-GGUF).
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  className="h-6 px-2"
                >
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {downloadProgress.currentSize || "0 B"} /{" "}
                    {downloadProgress.totalSize || "0 B"}
                  </span>
                  {downloadProgress.speed && (
                    <span>{downloadProgress.speed}</span>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Progress</span>
                <span>{downloadProgress.totalProgress}%</span>
              </div>
              <Progress
                value={downloadProgress.totalProgress}
                className="h-1"
              />
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
          onClick={handleDownload}
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
