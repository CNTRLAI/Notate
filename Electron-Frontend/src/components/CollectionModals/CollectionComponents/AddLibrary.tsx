import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Cloud, Database, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { sanitizeStoreName } from "@/lib/utils";
import { useUser } from "@/context/useUser";
import { useLibrary } from "@/context/useLibrary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useSysSettings } from "@/context/useSysSettings";
import { Progress } from "@/components/ui/progress";
import { fetchEmbeddingModels } from "@/data/models";

export default function AddLibrary() {
  const [newStore, setNewStore] = useState("");
  const [newStoreError, setNewStoreError] = useState<string | null>(null);
  const [newStoreDescription, setNewStoreDescription] = useState("");
  const [isLocal, setIsLocal] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [localEmbeddingModel, setLocalEmbeddingModel] = useState(
    "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5"
  );
  const [customModel, setCustomModel] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [newStoreType, setNewStoreType] = useState("Notes");
  const [currentFile, setCurrentFile] = useState<string>();
  const [fileProgress, setFileProgress] = useState(0);
  const { activeUser, apiKeys } = useUser();
  const { setLocalModalLoading } = useSysSettings();
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgressData>({
      message: "",
      totalProgress: 0,
    });
  const {
    setUserCollections,
    setSelectedCollection,
    setShowUpload,
    setShowAddStore,
    setFiles,
    setProgressMessage,
    progressMessage,
    embeddingModels,
    setEmbeddingModels,
  } = useLibrary();

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

  const handleCreateCollection = async () => {
    if (!activeUser) return;

    const cleanedStore = await sanitizeStoreName(newStore);

    if (!apiKeys.find((key) => key.provider === "openai")) {
      setIsLocal(true);
      setLocalEmbeddingModel(
        "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5"
      );
    }

    const newCollection = (await window.electron.createCollection(
      activeUser.id,
      cleanedStore,
      newStoreDescription,
      newStoreType,
      isLocal,
      localEmbeddingModel
    )) as unknown as Collection;

    if (newCollection.id === undefined) {
      setNewStoreError("This name is already in use");
      return;
    }

    window.electron.updateUserSettings({
      vectorstore: newCollection.id.toString(),
    });

    setUserCollections((prevCollections) => [
      ...prevCollections,
      newCollection,
    ]);
    setShowAddStore(false);
    setFiles([]);
    setNewStore("");
    setNewStoreDescription("");
    setNewStoreType("Notes");
    setSelectedCollection(newCollection);
    setShowUpload(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <div className="col-span-4">
            <div className="grid grid-cols-4 items-center gap-4 ">
              <Button
                variant="outline"
                size="icon"
                className="flex items-center gap-2"
                onClick={() => setShowAddStore(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Label
                htmlFor="newStore"
                className="col-span-2 text-center text-lg"
              >
                Create a new store
              </Label>
              {isLocal && (
                <div className="col-span-1 flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-[6px] px-4 pb-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
          <div className="rounded-[6px] p-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newStore" className="text-right">
                Store Name
              </Label>
              <div className="col-span-3">
                {newStoreError && (
                  <p className="text-destructive text-sm mb-2">
                    {newStoreError}
                  </p>
                )}
                <Textarea
                  id="newStore"
                  placeholder="Enter store name"
                  value={newStore}
                  onChange={(e) => {
                    setNewStore(e.target.value);
                    setNewStoreError(null);
                  }}
                  className="resize-none bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  placeholder="Enter store description (optional)"
                  value={newStoreDescription}
                  onChange={(e) => setNewStoreDescription(e.target.value)}
                  className="resize-none bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full">
              <div className="">
                <div className="flex gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            disabled={
                              apiKeys.find(
                                (key) => key.provider === "openai"
                              ) === undefined
                            }
                            type="button"
                            variant={isLocal ? "outline" : "secondary"}
                            className="flex-1 sm:text-[14px] text-[10px]"
                            onClick={() => setIsLocal(false)}
                          >
                            <Cloud className="h-4 w-4 mr-2" />
                            Open AI Embeddings
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          You must have an OpenAI API key to use this feature.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    type="button"
                    variant={isLocal ? "secondary" : "outline"}
                    className="flex-1 sm:text-[14px] text-[10px]"
                    onClick={() => setIsLocal(true)}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Local Embeddings
                  </Button>
                </div>
              </div>
            </div>

            {isLocal && showAdvancedSettings && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="localEmbeddingModel" className="text-right">
                    Embeddings
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={localEmbeddingModel}
                      onValueChange={(value) => {
                        setLocalEmbeddingModel(value);
                        setShowCustomInput(value === "custom");
                      }}
                    >
                      <SelectTrigger
                        id="localEmbeddingModel"
                        className="bg-background"
                      >
                        <SelectValue placeholder="Select embedding model" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5">
                          Default:
                          HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5
                        </SelectItem>
                        {embeddingModels
                          .filter(
                            (model) =>
                              model.name !==
                              "HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5"
                          )
                          .map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                        <SelectItem value="custom">
                          Add Hugging Face Model
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {showCustomInput && (
                  <div className="space-y-4">
                    <div className="">
                      <Input
                        id="customModel"
                        placeholder="Enter Model Repo eg: 'HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5'"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        className="resize-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        disabled={isDownloading}
                        onClick={async () => {
                          if (customModel.trim()) {
                            setIsDownloading(true);
                            try {
                              const modelsPath =
                                await window.electron.getModelsPath();
                              await window.electron.downloadModel({
                                modelId: customModel.trim(),
                                dirPath: modelsPath + "/" + customModel.trim(),
                              });
                              await fetchEmbeddingModels(setEmbeddingModels);
                              setLocalEmbeddingModel(customModel.trim());
                              setShowCustomInput(false);
                            } catch (error) {
                              console.error("Error downloading model:", error);
                              // You might want to show an error message to the user here
                            } finally {
                              setIsDownloading(false);
                            }
                          }
                        }}
                        className="w-full"
                      >
                        {isDownloading ? "Downloading..." : "Download Model"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {progressMessage && (
              <div className="mt-4 p-4 rounded-md border bg-background">
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
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4 ">
              <Label htmlFor="storeType" className="text-right ">
                Store Type
              </Label>
              <div className="col-span-3 bg-background">
                <Select
                  value={newStoreType}
                  onValueChange={(value) => setNewStoreType(value)}
                >
                  <SelectTrigger id="storeType">
                    <SelectValue placeholder="Select store type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Notes">Notes</SelectItem>
                    <SelectItem value="Chats">Chats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-4 pt-4 border-t">
        <Button
          type="button"
          onClick={() => setShowAddStore(false)}
          className="w-32 text-red-900"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          disabled={isDownloading || !newStore}
          type="button"
          variant="secondary"
          onClick={handleCreateCollection}
          className="w-32"
        >
          Create Store
        </Button>
      </div>
    </div>
  );
}
