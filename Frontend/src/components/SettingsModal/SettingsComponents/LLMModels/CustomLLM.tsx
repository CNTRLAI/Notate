import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUser } from "@/context/useUser";
import { toast } from "@/hooks/use-toast";

export default function CustomLLM() {
  const { apiKeyInput, setApiKeyInput, activeUser } = useUser();
  const [customProvider, setCustomProvider] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customModel, setCustomModel] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!activeUser) return;
      await window.electron.updateUserSettings(
        activeUser.id,
        "provider",
        customProvider
      );
      await window.electron.updateUserSettings(
        activeUser.id,
        "base_url",
        customEndpoint
      );
      await window.electron.updateUserSettings(
        activeUser.id,
        "model",
        customModel
      );
      await window.electron.addAPIKey(
        activeUser.id,
        apiKeyInput,
        customProvider
      );
      toast({
        title: "Custom provider added",
        description: "Your custom provider has been added",
      });
      setCustomProvider("");
      setCustomEndpoint("");
      setApiKeyInput("");
      setCustomModel("");
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
      <Input
        id="custom-provider-name"
        type="text"
        placeholder="Enter custom provider name (e.g. Deployed ooba model)"
        value={customProvider}
        onChange={(e) => setCustomProvider(e.target.value)}
        className="input-field"
      />

      <Input
        id="custom-endpoint"
        type="text"
        placeholder="Enter custom endpoint (e.g. https://api.custom.com/v1)"
        value={customEndpoint}
        onChange={(e) => setCustomEndpoint(e.target.value)}
        className="input-field"
      />
      <Input
        id="custom-model"
        type="text"
        placeholder="Enter custom model (e.g. gpt-4o)"
        value={customModel}
        onChange={(e) => setCustomModel(e.target.value)}
        className="input-field"
      />
      <Input
        id="custom-api-key"
        type="password"
        placeholder="Enter your custom API key"
        className="input-field"
        value={apiKeyInput}
        onChange={(e) => setApiKeyInput(e.target.value)}
      />
      <Button variant="secondary" onClick={handleSubmit} className="w-full">
        Add Custom Provider
      </Button>
    </div>
  );
}
