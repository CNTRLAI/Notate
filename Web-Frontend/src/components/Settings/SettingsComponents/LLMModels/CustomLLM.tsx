import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";

export default function CustomLLM() {
  const [customProvider, setCustomProvider] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModel, setCustomModel] = useState("");

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
      />
      <Button variant="secondary" className="w-full">
        Add Custom Provider
      </Button>
    </div>
  );
}
