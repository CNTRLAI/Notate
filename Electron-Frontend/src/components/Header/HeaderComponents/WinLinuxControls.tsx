import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "@/components/ui/menubar";
import { useUser } from "@/context/useUser";
import { useView } from "@/context/useView";
import { useLibrary } from "@/context/useLibrary";
export default function WinLinuxControls() {
  const {
    setActiveUser,
    setApiKeys,
    setPrompts,
    setConversations,
    handleResetChat,
  } = useUser();
  const { setSelectedCollection, setFiles } = useLibrary();
  const { setActiveView } = useView();
  return (
    <Menubar className="clickable-header-section bg-transparent border-none">
      <MenubarMenu>
        <MenubarTrigger className="clickable-header-section">
          File
        </MenubarTrigger>
        <MenubarContent className="clickable-header-section">
          <MenubarItem
            className="clickable-header-section"
            onClick={() => {
              handleResetChat();
            }}
          >
            New Conversation
          </MenubarItem>
          <MenubarItem
            className="clickable-header-section"
            onClick={() => {
              setActiveUser(null);
              setSelectedCollection(null);
              setApiKeys([]);
              setPrompts([]);
              setFiles([]);
              setConversations([]);
              setActiveView("SelectAccount");
            }}
          >
            Change User
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.quit()}
          >
            Quit
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="clickable-header-section">
          Edit
        </MenubarTrigger>
        <MenubarContent className="clickable-header-section">
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.undo()}
          >
            Undo
          </MenubarItem>
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.redo()}
          >
            Redo
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.cut()}
          >
            Cut
          </MenubarItem>
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.copy()}
          >
            Copy
          </MenubarItem>
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.paste()}
          >
            Paste
          </MenubarItem>
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.delete()}
          >
            Delete
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.selectAll()}
          >
            Select All
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            className="clickable-header-section"
            onClick={() => window.electron.print()}
          >
            Print
          </MenubarItem>
        </MenubarContent>
        <MenubarMenu>
          <MenubarTrigger className="clickable-header-section">
            View
          </MenubarTrigger>
          <MenubarContent className="clickable-header-section">
            <MenubarItem
              className="clickable-header-section"
              onClick={() => setActiveView("Chat")}
            >
              Chat
            </MenubarItem>
            <MenubarItem
              className="clickable-header-section"
              onClick={() => setActiveView("History")}
            >
              History
            </MenubarItem>
            <MenubarItem
              className="clickable-header-section"
              onClick={() => setActiveView("FileExplorer")}
            >
              File Explorer
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </MenubarMenu>
    </Menubar>
  );
}
