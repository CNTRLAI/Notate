"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { providerIcons } from "./providers/providerIcons";
import LocalLLM from "./LLMModels/LocalLLM";
import Ollama from "./LLMModels/Ollama";
import External from "./LLMModels/External";
import Openrouter from "./LLMModels/Openrouter";
import CustomLLM from "./LLMModels/CustomLLM";
import AzureOpenAI from "./LLMModels/AzureOpenAI";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { Search } from "lucide-react";
import { ApiKey } from "@/src/types/apiKeys";
import {
  CustomModel,
  Model,
  OllamaModel,
} from "@/src/types/Models";
import { LLMProvider } from "@/src/types/providers";
// Provider categories for better organization
const providerCategories = {
  "Cloud Providers": ["openai", "anthropic", "gemini", "deepseek", "xai"],
  "Self-Hosted": ["ollama", "local"],
  Advanced: ["openrouter", "azure open ai", "custom"],
} as const;

export default function LLMPanel() {
  const [showUpdateInput, setShowUpdateInput] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedProvider, setSelectedProvider] =
    useState<LLMProvider>("anthropic");

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [localModels, setLocalModels] = useState<Model[]>([]);

  const renderInputs = () => {
    switch (selectedProvider.toLowerCase()) {
      case "anthropic":
      case "xai":
      case "gemini":
      case "openai":
      case "deepseek":
        return (
          <External
            showUpdateInput={showUpdateInput}
            setShowUpdateInput={setShowUpdateInput}
          />
        );
      case "local":
        return <LocalLLM />;
      case "ollama":
        return <Ollama />;
      case "openrouter":
        return <Openrouter />;
      case "azure open ai":
        return <AzureOpenAI />;
      case "custom":
        return <CustomLLM />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="w-full">
        <div className="rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
          {selectedProvider === "" && (
            <div className="flex items-center justify-center mb-4">
              <p className="text-sm font-medium">Select a provider</p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(true)}
          >
            {selectedProvider ? (
              <div className="flex items-center gap-2">
                {providerIcons[selectedProvider as keyof typeof providerIcons]}
                <span>
                  {selectedProvider.charAt(0).toUpperCase() +
                    selectedProvider.slice(1)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Select a provider...
              </span>
            )}
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>

          <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Search providers..." />
              <CommandList>
                <CommandEmpty>No providers found.</CommandEmpty>
                {Object.entries(providerCategories).map(
                  ([category, providers]) => (
                    <CommandGroup key={category} heading={category}>
                      {providers.map((provider) => (
                        <CommandItem
                          key={provider}
                          value={provider}
                          onSelect={(value) => {
                            setSelectedProvider(value as LLMProvider);
                            setApiKeyInput("");
                            setShowUpdateInput(false);
                            setIsOpen(false);
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {
                            providerIcons[
                              provider as keyof typeof providerIcons
                            ]
                          }
                          <span>
                            {provider.charAt(0).toUpperCase() +
                              provider.slice(1)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                )}
              </CommandList>
            </Command>
          </CommandDialog>
        </div>
      </div>
      {selectedProvider && (
        <>
          <div className="mt-6">
            {renderInputs()}
            {selectedProvider.toLowerCase() !== "openrouter" &&
              selectedProvider.toLowerCase() !== "ollama" &&
              selectedProvider.toLowerCase() !== "local" &&
              selectedProvider.toLowerCase() !== "custom" &&
              selectedProvider.toLowerCase() !== "azure open ai" &&
              (!apiKeys.some(
                (key) => key.provider === selectedProvider.toLowerCase()
              ) ||
                showUpdateInput) && (
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    className="w-full mt-2"
                    type="submit"
                  >
                    Save API Key
                  </Button>
                </div>
              )}
          </div>
        </>
      )}
      <div className="mt-4 rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-medium">Active Providers</h3>
        </div>
        {apiKeys.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow"
              >
                {providerIcons[apiKey.provider as keyof typeof providerIcons]}
                <span className="ml-1.5">
                  {apiKey.provider.charAt(0).toUpperCase() +
                    apiKey.provider.slice(1)}
                </span>
              </div>
            ))}
            {customModels.length > 0 && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow">
                {providerIcons["custom" as keyof typeof providerIcons]}
                <span className="ml-1.5">Custom</span>
              </div>
            )}
            {ollamaModels.length > 0 && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow">
                {providerIcons["ollama" as keyof typeof providerIcons]}
                <span className="ml-1.5">Ollama</span>
              </div>
            )}
            {localModels.length > 0 && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow">
                {providerIcons["local" as keyof typeof providerIcons]}
                <span className="ml-1.5">Local</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
