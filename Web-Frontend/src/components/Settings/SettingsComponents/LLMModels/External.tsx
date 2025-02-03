import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";
interface ExternalProps {
  showUpdateInput: boolean;
  setShowUpdateInput: (show: boolean) => void;
}
const mockApiKeys = [
  { provider: "openai", key: "sk-1234567890" },
  { provider: "anthropic", key: "sk-1234567890" },
];

export default function External({
  showUpdateInput,
  setShowUpdateInput,
}: ExternalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");

  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const hasProviderKey = selectedProvider
    ? mockApiKeys.some(
        (key) => key.provider.toLowerCase() === selectedProvider.toLowerCase()
      )
    : false;

  return (
    <div className="space-y-4">
      {!hasProviderKey || showUpdateInput ? (
        <Input
          id={`${selectedProvider}-api-key`}
          type="password"
          placeholder={`Enter your ${selectedProvider?.toUpperCase()} API key`}
          className="input-field"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
        />
      ) : (
        hasProviderKey && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setShowUpdateInput(true);
              setApiKeyInput("");
            }}
          >
            Update API Key
          </Button>
        )
      )}
    </div>
  );
}
