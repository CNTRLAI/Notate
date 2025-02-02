import { Cpu, Trash, Copy, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/useUser";
import { useState } from "react";
import { useClipboard } from "use-clipboard-copy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface APIKey {
  id: number;
  key: string;
  name: string;
  expiration: string | null;
}

export function DevIntegration() {
  const { activeUser, devAPIKeys, setDevAPIKeys } = useUser();
  const [keyName, setKeyName] = useState("");
  const [expiration, setExpiration] = useState<string | null>(null);
  const [activeKeysMinimized, setActiveKeysMinimized] = useState(true);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<{
    key: string;
    name: string;
    isNew?: boolean;
  } | null>(null);
  const clipboard = useClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (selectedKey) {
      clipboard.copy(selectedKey.key);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!activeUser) return;
    await window.electron.deleteDevAPIKey(activeUser.id, id);
    setDevAPIKeys(devAPIKeys.filter((key) => key.id !== id));
  };

  const handleGenerateKey = async () => {
    if (!activeUser) return;
    const results = await window.electron.addDevAPIKey(
      activeUser.id,
      keyName,
      expiration === "never" ? null : expiration
    );
    setDevAPIKeys([...devAPIKeys, results]);
    setSelectedKey({ key: results.key, name: keyName, isNew: true });
    setShowKeyDialog(true);
    setKeyName("");
    setExpiration(null);
  };

  const handleViewKey = (key: APIKey) => {
    setSelectedKey({ key: key.key, name: key.name });
    setShowKeyDialog(true);
  };

  return (
    <div>
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedKey?.isNew ? "API Key Generated" : "View API Key"}
            </DialogTitle>
            <DialogDescription>
              {selectedKey?.isNew
                ? "Please copy your API key. You won't be able to see it again."
                : `Viewing API key: ${selectedKey?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-[8px] relative">
            <p className="text-sm break-all font-mono pr-12">
              {selectedKey?.key}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4">
        <div className="rounded-[6px] bg-background">
          <div className="flex items-center gap-2 ">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Generate API Key</h3>
          </div>

          <div className="space-y-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Name</label>
              <Input
                type="text"
                placeholder="Enter a name for this API key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiration</label>
              <Select
                value={expiration ?? undefined}
                onValueChange={(value) => setExpiration(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="never">Never expire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerateKey}
            >
              Generate Key
            </Button>
          </div>
        </div>

        <div className="rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-medium">Active API Keys</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveKeysMinimized(!activeKeysMinimized)}
            >
              {activeKeysMinimized ? "View Keys" : "Minimize"}
            </Button>
          </div>

          {!activeKeysMinimized && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto p-2">
              {devAPIKeys.length > 0 ? (
                devAPIKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-2 rounded-[4px] bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {key.expiration ?? "Never"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewKey(key)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="h-8 w-8 p-0 hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active API keys
                </p>
              )}
            </div>
          )}
          {activeKeysMinimized && (
            <p className="text-sm font-medium">
              {devAPIKeys.length} active keys
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
