import { useMemo } from "react";
import Chat from "@/components/Chat/Chat";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/Header/Header";
import { useView } from "@/context/useView";
import CreateAccount from "@/components/Authentication/CreateAccount";
import SelectAccount from "@/components/Authentication/SelectAccount";
import History from "@/components/History/History";
import SettingsAlert from "@/components/AppAlert/SettingsAlert";
import { useSysSettings } from "@/context/useSysSettings";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import FileExplorer from "@/components/FileExplorer/FileExplorer";

function App() {
  const { activeView } = useView();
  const { users } = useSysSettings();

  useAppInitialization();

  const activeUsages = useMemo(() => {
    switch (activeView) {
      case "Chat":
        return <Chat />;
      case "History":
        return <History />;
      case "Signup":
        return <CreateAccount />;
      case "SelectAccount":
        return <SelectAccount users={users} />;
      case "FileExplorer":
        return <FileExplorer />;
      default:
        return null;
    }
  }, [activeView, users]);

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] overflow-hidden">
      <Toaster />
      <Header />
      <SettingsAlert />
      <div className="flex-1 overflow-hidden pt-4">{activeUsages}</div>
    </div>
  );
}

export default App;
