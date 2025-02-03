import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useSysSettings } from "@/src/context/useSysSettings";
import { useUser } from "@/src/context/useUser";
import { toast } from "@/src/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Download, HelpCircle, Loader2, X } from "lucide-react";
import { Progress } from "@/src/components/ui/progress";
import { DownloadProgressData } from "@/src/types/progress";

export default function AddLocalModel() {
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgressData>({
      message: "",
      totalProgress: 0,
    });
  const [progressMessage, setProgressMessage] = useState("");
  const [currentFile, setCurrentFile] = useState<string>();
  const [fileProgress, setFileProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const { activeUser } = useUser();
  const { setLocalModel, localModel, setLocalModalLoading, localModalLoading } =
    useSysSettings();

  const handleCancel = async () => {
    try {
      /*    const result = await window.electron.cancelDownload(); */
      const result = { success: true };
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
      const modelId = localModel.replace("hf.co/", "");

      /* await window.electron.downloadModel({
        modelId,
        dirPath: `${localModelDir}/${modelId}`,
      }); */

      toast({
        title: "Success",
        description: `Downloaded model ${modelId}`,
      });
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex flex-row gap-2 items-center">
              <Input
                className="w-full"
                placeholder="Enter model ID (e.g. TheBloke/Mistral-7B-v0.1-GGUF)"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
              />{" "}
              <HelpCircle className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>
              Enter a Hugging Face model ID (e.g.
              TheBloke/Mistral-7B-v0.1-GGUF).
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
