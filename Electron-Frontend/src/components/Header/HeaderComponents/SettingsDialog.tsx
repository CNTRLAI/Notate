import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useSysSettings } from "@/context/useSysSettings";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import WindowControls from "./MainWindowControl";

export default function SettingsDialog() {
  const {
    settingsOpen,
    setSettingsOpen,
    platform,
    isMaximized,
    setIsMaximized,
  } = useSysSettings();

  const renderWindowControls = WindowControls({
    isMaximized,
    setIsMaximized,
    platform,
  });
  return (
    <>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild className="clickable-header-section">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-none"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Chat Settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[100vh] w-[80%] mt-4">
          <DialogHeader className="sm:pb-4 pb-2">
            <DialogTitle className="text-xl font-semibold">
              Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure your application preferences and settings
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-hidden overflow-x-hidden pr-2">
            <SettingsModal />
          </div>
        </DialogContent>
      </Dialog>
      {platform !== "darwin" && renderWindowControls}
    </>
  );
}
