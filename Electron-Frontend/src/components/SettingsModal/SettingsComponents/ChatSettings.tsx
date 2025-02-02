import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Check, ChevronDown, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { useUser } from "@/context/useUser";
import { useState, useEffect } from "react";
import { useView } from "@/context/useView";
import { useSysSettings } from "@/context/useSysSettings";
import { toast } from "@/hooks/use-toast";
import { useLibrary } from "@/context/useLibrary";
import { Input } from "@/components/ui/input";

export default function ChatSettings() {
  const {
    setApiKeys,
    setPrompts,
    setConversations,
    setActiveUser,
    openRouterModels,
  } = useUser();
  const { setSelectedCollection, setFiles } = useLibrary();
  const { activeUser, apiKeys, prompts, azureModels, customModels } = useUser();
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [showNewPrompt, setShowNewPrompt] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<string>("");
  const { setActiveView } = useView();
  const {
    settings,
    setSettings,
    setSettingsOpen,
    localModels,
    handleRunModel,
    maxTokens,
    setMaxTokens,
    ollamaModels,
    setLocalModalLoading,
    fetchSettings,
    setSelectedProvider,
  } = useSysSettings();
  const [localMaxTokens, setLocalMaxTokens] = useState<string>("");

  useEffect(() => {
    setLocalMaxTokens(maxTokens?.toString() || "");
  }, [maxTokens]);

  const handleMaxTokensChange = async (value: string) => {
    setLocalMaxTokens(value);
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) {
      setMaxTokens(parsedValue);
      if (activeUser) {
        await window.electron.updateUserSettings({
          userId: activeUser.id,
          maxTokens: parsedValue,
        });
        setSettings((prev) => ({ ...prev, maxTokens: parsedValue }));
      }
    }
  };

  const handleProviderModelChange = async (
    provider: string,
    model_name: string
  ) => {
    if (!activeUser) {
      return;
    }
    await window.electron.updateUserSettings({
      userId: activeUser.id,
      provider: provider.toLowerCase(),
      model: model_name,
    });
    if (provider === "ollama") {
      await window.electron.updateUserSettings({
        userId: activeUser.id,
        ollamaModel: model_name,
      });
    }
    if (provider === "azure open ai") {
      await window.electron.updateUserSettings({
        userId: activeUser.id,
        baseUrl:
          azureModels?.find((model) => model.name === model_name)?.endpoint ??
          "",
        selectedAzureId:
          azureModels?.find((model) => model.name === model_name)?.id ?? 0,
      });
    }
    if (provider === "custom") {
      await window.electron.updateUserSettings({
        userId: activeUser.id,
        model:
          customModels?.find((model) => model.name === model_name)?.model ?? "",
        baseUrl:
          customModels?.find((model) => model.name === model_name)?.endpoint ??
          "",
        selectedCustomId:
          customModels?.find((model) => model.name === model_name)?.id ?? 0,
      });
    }

    setSettings((prev) => ({
      ...prev,
      model: model_name,
      provider: provider.toLowerCase(),
    }));
  };

  const modelTokenDefaults = {
    "gpt-3.5-turbo": 4096,
    "gpt-4o": 8192,
    "gpt-4o-mini": 4096,
    "claude-3-5-sonnet-20241022": 8192,
    "claude-3-5-haiku-20241022": 8192,
    "claude-3-opus-20240229": 4096,
    "claude-3-sonnet-20240229": 4096,
    "claude-3-haiku-20240307": 4096,
    "claude-2.1": 4096,
    "claude-2.0": 4096,
    "gemini-1.5-flash": 8192,
    "gemini-1.5-pro": 8192,
    "grok-beta": 8192,
    local: 2048,
    ollama: 2048,
    "azure open ai": 4096,
    custom: 2048,
    deepseek: 8192,
  };

  const modelOptions = {
    openai: ["gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"],
    anthropic: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-2.1",
      "claude-2.0",
    ],
    gemini: ["gemini-1.5-flash", "gemini-1.5-pro"],
    xai: ["grok-beta"],
    openrouter: openRouterModels || [],
    local: Array.isArray(localModels)
      ? localModels.map((model) => model.name)
      : [],
    ollama: ollamaModels?.map((model) => model.name) || [],
    "azure open ai": azureModels?.map((model) => model.name) || [],
    custom: customModels?.map((model) => model.name) || [],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
  };

  const handleAddPrompt = async () => {
    if (activeUser) {
      const newPromptObject = await window.electron.addUserPrompt(
        activeUser.id,
        newPrompt,
        newPrompt
      );
      await window.electron.updateUserSettings({
        userId: activeUser.id,
        promptId: newPromptObject.id,
      });
      setSettings((prev) => ({ ...prev, promptId: newPromptObject.id }));
      setPrompts((prev) => [
        ...prev,
        {
          id: newPromptObject.id,
          name: newPromptObject.name,
          prompt: newPromptObject.prompt,
          userId: activeUser.id,
        },
      ]);
    }
  };

  useEffect(() => {
    if (settings.promptId) {
      const promptId = settings.promptId.toString();
      const selectedPromptName =
        prompts.find((p) => p.id === parseInt(promptId))?.name || "";
      setValue(selectedPromptName);
    }
  }, [settings.promptId, prompts]);

  // Add new useEffect for handling initial model selection
  useEffect(() => {
    if (
      settings.provider === "custom" &&
      settings.selectedCustomId &&
      customModels
    ) {
      const selectedCustomModel = customModels.find(
        (model) => model.id === settings.selectedCustomId
      );
      if (selectedCustomModel) {
        setSettings((prev) => ({
          ...prev,
          model: selectedCustomModel.model,
          displayModel: selectedCustomModel.name,
        }));
      }
    }
  }, [settings.provider, settings.selectedCustomId, customModels]);

  return (
    <div className="space-y-6">
      <div className="rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-start gap-4 py-2">
            <Label
              htmlFor="prompt"
              className="text-right text-sm font-medium pt-2"
            >
              Prompt
            </Label>
            <div className="col-span-3 space-y-4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="select-42"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-secondary/05 px-3 font-normal bg-background"
                  >
                    <span
                      className={cn(
                        "truncate",
                        !value && "text-muted-foreground"
                      )}
                    >
                      {value || "Default Prompt"}
                    </span>
                    <ChevronDown size={16} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search prompts..." />
                    <CommandList>
                      <CommandEmpty>No prompt found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setShowNewPrompt(true);
                            setOpen(false);
                            setValue("Adding New Prompt");
                          }}
                          className="flex items-center"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Prompt
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        {prompts.map((prompt) => (
                          <CommandItem
                            key={prompt.id}
                            value={prompt.name}
                            onSelect={(currentValue) => {
                              setValue(currentValue);
                              setOpen(false);
                              if (activeUser) {
                                window.electron.updateUserSettings({
                                  userId: activeUser.id,
                                  promptId:
                                    prompts.find((p) => p.name === currentValue)
                                      ?.id ?? 0,
                                });
                                setSettings((prev) => ({
                                  ...prev,
                                  promptId:
                                    prompts.find((p) => p.name === currentValue)
                                      ?.id ?? 0,
                                }));
                              }
                              toast({
                                title: "Prompt set",
                                description: `Prompt set to ${currentValue}`,
                              });
                            }}
                          >
                            {prompt.name.slice(0, 50)}
                            {value === prompt.name && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {showNewPrompt && (
                <div className="flex gap-4">
                  <Textarea
                    id="newPrompt"
                    placeholder="Enter new prompt"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      setShowNewPrompt(false);
                      handleAddPrompt();
                      setNewPrompt("");
                      toast({
                        title: "Prompt added",
                        description: `Prompt added to ${value}`,
                      });
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right text-sm font-medium">
              Model
            </Label>
            <Select
              value={
                settings.provider === "custom"
                  ? settings.displayModel || settings.model
                  : settings.model
              }
              onValueChange={async (value) => {
                let provider = Object.keys(modelOptions).find((key) =>
                  modelOptions[key as keyof typeof modelOptions].includes(value)
                ) as LLMProvider;

                if (modelOptions.ollama.includes(value)) {
                  provider = "ollama";
                }
                if (!activeUser) {
                  return;
                }

                if (provider === "local") {
                  await handleProviderModelChange(provider, value);
                  await window.electron.updateUserSettings({
                    userId: activeUser.id,
                    model:
                      localModels.find((model) => model.name === value)?.name ??
                      "",
                    provider: "local",
                    modelType:
                      localModels.find((model) => model.name === value)?.type ??
                      "",
                    modelLocation:
                      localModels.find((model) => model.name === value)
                        ?.model_location ?? "",
                  });
                }
                await handleProviderModelChange(provider, value);
                await fetchSettings(activeUser);

                const newMaxTokens =
                  modelTokenDefaults[
                    value.toLowerCase() as keyof typeof modelTokenDefaults
                  ] ||
                  modelTokenDefaults[
                    provider.toLowerCase() as keyof typeof modelTokenDefaults
                  ] ||
                  modelTokenDefaults.local;

                setMaxTokens(newMaxTokens);
                setLocalMaxTokens(newMaxTokens.toString());

                const isLocalModel = modelOptions.local.includes(value);
                if (isLocalModel && activeUser) {
                  const selectedModelPath = localModels.find(
                    (model) => model.name === value
                  )?.model_location;
                  const selectedModelType = localModels.find(
                    (model) => model.name === value
                  )?.type;
                  toast({
                    title: "Local model loading",
                    description: `Loading ${value}...`,
                  });
                  if (selectedModelPath && selectedModelType) {
                    await handleRunModel(
                      value,
                      selectedModelPath,
                      selectedModelType,
                      activeUser.id.toString()
                    );
                  }
                } else if (modelOptions.ollama.includes(value)) {
                  toast({
                    title: "Ollama model loading",
                    description: `Loading ${value}...`,
                  });
                  if (activeUser) {
                    await window.electron.runOllama(value, activeUser);
                    setLocalModalLoading(false);
                    toast({
                      title: "Ollama model loaded",
                      description: `Ollama model loaded`,
                    });
                  }
                } else {
                  toast({
                    title: "Model set",
                    description: `Model set to ${value}`,
                  });
                }
              }}
            >
              <SelectTrigger className="col-span-3 bg-background">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {apiKeys.map((apiKey) => (
                  <SelectGroup key={apiKey.provider}>
                    <SelectLabel className="font-semibold">
                      {apiKey.provider.toUpperCase()}
                    </SelectLabel>
                    {modelOptions[
                      apiKey.provider.toLowerCase() as keyof typeof modelOptions
                    ]?.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                {localModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="font-semibold">LOCAL</SelectLabel>
                    {modelOptions.local.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {ollamaModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="font-semibold">OLLAMA</SelectLabel>
                    {modelOptions.ollama.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {customModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="font-semibold">CUSTOM</SelectLabel>
                    {modelOptions.custom.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="temperature"
              className="text-right text-sm font-medium"
            >
              Temperature
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[settings.temperature ?? 0.7]}
                onValueChange={(value) => {
                  setSettings((prev) => ({ ...prev, temperature: value[0] }));
                  if (activeUser) {
                    window.electron.updateUserSettings({
                      userId: activeUser.id,
                      temperature: value[0],
                    });
                  }
                }}
                className="flex-grow"
              />
              <span className="w-12 text-right text-sm tabular-nums">
                {settings.temperature?.toFixed(1) ?? "0.7"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="maxTokens"
              className="text-right text-sm font-medium"
            >
              Max Tokens
            </Label>
            <Input
              id="maxTokens"
              type="number"
              value={localMaxTokens}
              onChange={(e) => handleMaxTokensChange(e.target.value)}
              className="col-span-3 bg-background"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-4 pt-6 border-t">
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setSettingsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSettingsOpen(false);
              if (activeUser) {
                window.electron.updateUserSettings({
                  vectorstore: settings.vectorstore ?? "",
                  temperature: Number(settings.temperature),
                  model: settings.model ?? "",
                  provider: settings.provider ?? "",
                });
              }

              toast({
                title: "Settings saved",
                description: `Settings saved`,
              });
            }}
          >
            Save Changes
          </Button>
        </div>

        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              setActiveUser(null);
              setSelectedCollection(null);
              setApiKeys([]);
              setPrompts([]);
              setFiles([]);
              setConversations([]);
              setActiveView("SelectAccount");
              setSettingsOpen(false);
              setSelectedProvider("");
              toast({
                title: "Logged out",
                description: `Logged out of all accounts`,
              });
            }}
          >
            <LogOut size={14} className="mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
