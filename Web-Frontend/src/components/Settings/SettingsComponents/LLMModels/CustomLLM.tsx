import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";
import { useUser } from "@/src/context/useUser";
import { toast } from "@/src/hooks/use-toast";
import { useSysSettings } from "@/src/context/useSysSettings";
import { updateSetting } from "@/src/data/settings";
export default function CustomLLM() {
  const { apiKeyInput, setApiKeyInput, activeUser } = useUser();
  const [customProvider, setCustomProvider] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModel, setCustomModel] = useState("");
  const { settings } = useSysSettings();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!activeUser) return;
      /*  const apiId = await window.electron.addCustomAPI(
        activeUser.id,
        customProvider,
        customBaseUrl,
        apiKeyInput,
        customModel
      ); */
      await updateSetting(
        {
          ...settings,
          provider: "custom",
          baseUrl: customBaseUrl,
          model: customModel,
          isLocal: false,
          selectedCustomId: 0,
        },
        Number(activeUser.id)
      );
      toast({
        title: "Custom provider added",
        description: "Your custom provider has been added",
      });
      setCustomProvider("");
      setCustomBaseUrl("");
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
        id="custom-base-url"
        type="text"
        placeholder="Enter base url (e.g. https://api.custom.com/v1)"
        value={customBaseUrl}
        onChange={(e) => setCustomBaseUrl(e.target.value)}
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
