import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/src/components/ui/command";
import { Check, ChevronDown, Plus, LogOutIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Textarea } from "@/src/components/ui/textarea";
import { Slider } from "@/src/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/src/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "@/src/hooks/use-toast";
import { Input } from "@/src/components/ui/input";
import { ApiKey } from "@/src/types/apiKeys";
import { UserPrompts } from "@/src/types/prompts";
import {
  Model,
  OllamaModel,
  CustomModel,
  AzureModel,
  OpenRouterModel,
} from "@/src/types/Models";
import { signOut } from "next-auth/react";

export default function ChatSettings() {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [showNewPrompt, setShowNewPrompt] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<string>("");
  const [maxTokens, setMaxTokens] = useState<number>(0);
  const [localMaxTokens, setLocalMaxTokens] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [prompts, setPrompts] = useState<UserPrompts[]>([]);
  const [localModels, setLocalModels] = useState<Model[]>([]);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [azureModels, setAzureModels] = useState<AzureModel[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(
    []
  );
  useEffect(() => {
    setLocalMaxTokens(maxTokens?.toString() || "");
  }, [maxTokens]);

  const handleMaxTokensChange = async (value: string) => {
    console.log(value);
  };

  const handleProviderModelChange = async (
    provider: string,
    model_name: string
  ) => {
    console.log(provider, model_name);
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

  const handleAddPrompt = async () => {};

  useEffect(() => {
    console.log(prompts);
  }, [prompts]);

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
            <Select value={""}>
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
                value={[0.7]}
                className="flex-grow"
              />
              <span className="w-12 text-right text-sm tabular-nums">0.7</span>
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
          <Button variant="outline" onClick={() => {}}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toast({
                title: "Settings saved",
                description: `Settings saved`,
              });
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          signOut();
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
