import { useUser } from "@/context/useUser";
import { useEffect } from "react";
import { useSysSettings } from "@/context/useSysSettings";
import SearchComponent from "./HeaderComponents/Search";
import SettingsDialog from "./HeaderComponents/SettingsDialog";
import WindowControls from "./HeaderComponents/MainWindowControl";
import WinLinuxControls from "./HeaderComponents/WinLinuxControls";
import { useChatInput } from "@/context/useChatInput";
import ToolsDialog from "./HeaderComponents/ToolsDialog";
export function Header() {
  const { isSearchOpen, searchTerm, conversations, setFilteredConversations } =
    useUser();

  const { platform, isMaximized, setIsMaximized } = useSysSettings();
  const { input } = useChatInput();
  useEffect(() => {
    if (isSearchOpen) {
      const filtered =
        conversations
          ?.filter(
            (conv) =>
              conv?.title
                ?.toLowerCase?.()
                ?.includes(searchTerm?.toLowerCase?.() ?? "") ?? false
          )
          ?.sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0))
          ?.slice(0, 10) ?? [];
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations, isSearchOpen, setFilteredConversations]);

  // Update filtered conversations when input is cleared (new chat request)
  useEffect(() => {
    if (!input) {
      const filtered =
        conversations
          ?.sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0))
          ?.slice(0, 10) ?? [];
      setFilteredConversations(filtered);
    }
  }, [conversations, setFilteredConversations]);

  const renderWindowControls = WindowControls({
    isMaximized,
    setIsMaximized,
    platform,
  });

  return (
    <header
      className={`bg-secondary/50 grid grid-cols-3 items-center border-b border-secondary ${
        platform !== "darwin" ? "pr-0" : ""
      }`}
    >
      {/* Left column */}
      <div className="flex items-center">
        {platform === "darwin" ? renderWindowControls : <WinLinuxControls />}
      </div>
      {/* Center column */}
      <SearchComponent />
      {/* Right column */}
      <div className="flex items-center justify-end">
        <ToolsDialog />
        <SettingsDialog />
      </div>
    </header>
  );
}
