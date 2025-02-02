"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useSysSettings } from "@/context/useSysSettings";
import { useUser } from "@/context/useUser";
import { providerIcons } from "./providers/providerIcons";
import { defaultProviderModel } from "./providers/defaultsProviderModels";
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
} from "@/components/ui/command";
import { Search } from "lucide-react";

// Provider categories for better organization
const providerCategories = {
  "Cloud Providers": ["openai", "anthropic", "gemini", "deepseek", "xai"],
  "Self-Hosted": ["ollama", "local"],
  Advanced: ["openrouter", "azure open ai", "custom"],
} as const;

export default function LLMPanel() {
  const [showUpdateInput, setShowUpdateInput] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeUser,
    apiKeys,
    setApiKeys,
    handleResetChat,
    apiKeyInput,
    setApiKeyInput,
    customModels,
  } = useUser();
  const {
    setSettings,
    ollamaModels,
    localModels,
    selectedProvider,
    setSelectedProvider,
  } = useSysSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedApiKey = apiKeyInput.trim();
    const result = await window.electron.keyValidation({
      apiKey: trimmedApiKey,
      inputProvider: selectedProvider.toLowerCase(),
    });
    if (result.error) {
      toast({
        title: "Invalid API Key",
        description: "API key is invalid. Please try again.",
        variant: "destructive",
      });
      return;
    }

    handleResetChat();
    if (activeUser && selectedProvider) {
      await window.electron.addAPIKey(
        activeUser.id,
        trimmedApiKey,
        selectedProvider.toLowerCase()
      );
      if (!apiKeys.some((key) => key.provider === selectedProvider)) {
        setApiKeys((prevKeys) => [
          ...prevKeys,
          {
            id: Date.now(),
            key: trimmedApiKey,
            provider: selectedProvider.toLowerCase(),
          },
        ]);
      }
      setShowUpdateInput(false);
      setApiKeyInput("");
      toast({
        title: "API Key Saved",
        description: `Your ${selectedProvider.toUpperCase()} API key has been saved successfully.`,
      });
    }
  };

  const handleProviderModelChange = async (provider: LLMProvider) => {
    setSettings((prev) => ({
      ...prev,
      provider: provider,
      model:
        defaultProviderModel[provider as keyof typeof defaultProviderModel],
    }));
    try {
      if (activeUser) {
        await window.electron.updateUserSettings({
          userId: activeUser.id,
          provider: provider.toLowerCase(),
        });
        if (provider === "openrouter") {
          await window.electron.addOpenRouterModel(
            activeUser.id,
            "openai/gpt-3.5-turbo"
          );
        } else {
          await window.electron.updateUserSettings({
            userId: activeUser.id,
            model:
              defaultProviderModel[
                provider as keyof typeof defaultProviderModel
              ],
          });
        }
      }
    } catch (error) {
      console.error("Error updating user settings:", error);
    }
  };

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
                    onClick={(e) => {
                      handleProviderModelChange(
                        selectedProvider as LLMProvider
                      );
                      handleSubmit(e);
                    }}
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
