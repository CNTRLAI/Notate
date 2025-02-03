import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export default function AzureOpenAI() {
  const [customProvider, setCustomProvider] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModel, setCustomModel] = useState("");

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

      <Button variant="secondary" className="w-full">
        Add Azure Open AI Provider
      </Button>
    </div>
  );
}
