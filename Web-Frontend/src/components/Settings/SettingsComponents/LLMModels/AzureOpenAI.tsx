import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";
import { useUser } from "@/src/context/useUser";
import { toast } from "@/src/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { updateSetting } from "@/src/data/settings";
import { useSysSettings } from "@/src/context/useSysSettings";
import { createApiKey } from "@/src/data/apiKeys";
export default function AzureOpenAI() {
  const { apiKeyInput, setApiKeyInput, activeUser, fetchAzureModels } =
    useUser();
  const [customProvider, setCustomProvider] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModel, setCustomModel] = useState("");
  const { settings } = useSysSettings();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!activeUser) return;
      /* const azureId = await window.electron.addAzureOpenAIModel(
        activeUser.id,
        customProvider,
        customModel,
        customBaseUrl,
        apiKeyInput
      ); */
      await updateSetting(
        {
          ...settings,
          provider: "azure open ai",
          selectedAzureId: 0,
          baseUrl: customBaseUrl,
          model: customModel,
        },
        activeUser.id
      );

      await createApiKey(
        {
          id: 0,
          key: apiKeyInput,
          provider: "azure open ai",
        },
        activeUser.id
      );
      toast({
        title: "Custom provider added",
        description: "Your custom provider has been added",
      });
      setCustomProvider("");
      setCustomBaseUrl("");
      setApiKeyInput("");
      setCustomModel("");
      fetchAzureModels();
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An error occurred while adding your custom provider. Please try again." +
          error,
      });
    }
  };

  return (
    <div className="space-y-2">
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2 w-full">
              <Input
                id="name"
                type="text"
                placeholder="Enter a name (e.g. Azure OpenAI gpt-4)"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                className="input-field"
              />

              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Give your Azure OpenAI deployment a name
                <br />
                Example: &quot;Azure GPT-4 Production&quot;
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          {" "}
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2 w-full">
              <Input
                id="azure-endpoint"
                type="text"
                placeholder="Enter Azure endpoint"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                className="input-field"
              />

              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Your Azure OpenAI endpoint URL
                <br />
                Example:
                https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2024-02-15-preview
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2 w-full">
              <Input
                id="custom-model"
                type="text"
                placeholder="Enter deployment name"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="input-field"
              />

              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                The deployment model name in Azure
                <br />
                Example: &quot;gpt-4&quot; or &quot;gpt-35-turbo&quot;
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-2 w-full">
              <Input
                id="azure-api-key"
                type="password"
                placeholder="Enter your Azure API key"
                className="input-field"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />

              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Your Azure OpenAI API key
                <br />
                Format: 32-character string
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Button variant="secondary" onClick={handleSubmit} className="w-full">
        Add Azure Open AI Provider
      </Button>
    </div>
  );
}
