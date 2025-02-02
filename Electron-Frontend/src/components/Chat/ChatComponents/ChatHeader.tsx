import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { IngestProgress } from "@/components/CollectionModals/CollectionComponents/IngestProgress";
import logo from "@/assets/icon.png";
import { useSysSettings } from "@/context/useSysSettings";
import { useChatLogic } from "@/hooks/useChatLogic";

export function ChatHeader() {
  const { localModalLoading } = useSysSettings();
  const { handleResetChat } = useChatLogic();

  return (
    <div className="p-2 bg-card border-b border-secondary flex items-center">
      <div className="flex items-center flex-1">
        <img src={logo} alt="logo" className="h-6 w-6 mr-2" />

        <h1 className="text-2xl font-bold">Notate</h1>
      </div>
      <div className="flex-1 flex justify-center">
        {localModalLoading && (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4" />
            <span>Loading local model...</span>
          </div>
        )}
        <IngestProgress truncate={true} />
      </div>
      <div className="flex-1 flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            handleResetChat();
          }}
        >
          <PlusCircle className="mr-2" /> New Chat
        </Button>
      </div>
    </div>
  );
}
