import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useSysSettings } from "@/src/context/useSysSettings";
import { useUser } from "@/src/context/useUser";
import { createApiKey } from "@/src/data/apiKeys";
import { updateSetting } from "@/src/data/settings";
import { toast } from "@/src/hooks/use-toast";
import { useState } from "react";

export default function Openrouter() {
  const { openRouterModels, activeUser } = useUser();
  const [openRouterModel, setOpenRouterModel] = useState<string>("");
  const [openRouterKey, setOpenRouterKey] = useState<string>("");
  const [hasOpenRouter, setHasOpenRouter] = useState<boolean>(
    openRouterModels.length > 0
  );
  const { settings } = useSysSettings();
  const handleSaveOpenRouterKey = async () => {
    if (!activeUser) return;
    console.log("Saving OpenRouter key");
    await createApiKey(
      {
        id: 0,
        key: openRouterKey,
        provider: "openrouter",
      },
      Number(activeUser.id)
    );
    await updateSetting(
      {
        ...settings,
        provider: "openrouter",
        model: openRouterModel,
      },
      Number(activeUser.id)
    );
    setHasOpenRouter(true);
    setOpenRouterKey("");
    toast({
      title: "OpenRouter Key Saved",
      description: "Your OpenRouter key has been saved",
    });
  };

  const handleAddOpenRouterModel = async () => {
    try {
      if (!openRouterModel.trim()) {
        toast({
          title: "Model Required",
          description: "Please enter an OpenRouter model ID.",
          variant: "destructive",
        });
        return;
      }
      if (!activeUser) return;
      /*       await window.electron.addOpenRouterModel(activeUser.id, openRouterModel);
       */ await updateSetting(
        {
          ...settings,
          provider: "openrouter",
          model: openRouterModel,
        },
        Number(activeUser.id)
      );
      toast({
        title: "Model Added",
        description: "Your OpenRouter model has been added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An error occurred while adding the model. Please try again." + error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {!hasOpenRouter && (
        <>
          <Input
            id="local-model-path"
            type="text"
            placeholder="Enter your OpenRouter API key"
            className="input-field"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              handleSaveOpenRouterKey();
            }}
          >
            Save API Key
          </Button>
        </>
      )}
      {hasOpenRouter && (
        <>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setHasOpenRouter(false)}
          >
            Update API Key
          </Button>
          <Input
            className="w-full"
            placeholder="Enter OpenRouter model ID (e.g. openai/gpt-3.5-turbo)"
            value={openRouterModel}
            onChange={(e) => setOpenRouterModel(e.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleAddOpenRouterModel()}
          >
            Add Model
          </Button>
        </>
      )}
    </div>
  );
}
