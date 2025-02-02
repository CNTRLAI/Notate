import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSysSettings } from "@/context/useSysSettings";
import { useUser } from "@/context/useUser";

interface ExternalProps {
  showUpdateInput: boolean;
  setShowUpdateInput: (show: boolean) => void;
}

export default function External({
  showUpdateInput,
  setShowUpdateInput,
}: ExternalProps) {
  const { selectedProvider } = useSysSettings();
  const { apiKeyInput, setApiKeyInput, apiKeys } = useUser();

  const hasProviderKey = selectedProvider
    ? apiKeys.some(
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
