import {
  FileIcon,
  Trash2,
  Edit2,
  FolderOpen,
  File,
  Folder,
  ChevronLeftCircle,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/useUser";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useView } from "@/context/useView";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path?: string;
}

interface FileItemProps {
  node: FileNode;
  depth: number;
  onDelete: () => void;
  onRename: () => void;
  onReload: () => Promise<void>;
  parentPath?: string;
}

const FileItem: React.FC<FileItemProps> = ({
  node,
  depth,
  onDelete,
  onRename,
  onReload,
  parentPath,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const paddingLeft = `${depth * 16}px`;
  const { activeUser } = useUser();
  const fullPath = parentPath
    ? `${parentPath}/${node.name}`
    : `${activeUser?.id}_${activeUser?.name}/${node.name}`;

  const handleOpenFolder = () => {
    if (!activeUser) return;
    window.electron.openCollectionFolderFromFileExplorer(fullPath);
  };

  const handleRename = async () => {
    if (!activeUser) return;
    if (newName.trim() === "") return;

    try {
      const result = await window.electron.renameFile(
        activeUser.id,
        activeUser.name,
        fullPath,
        newName
      );
      if (result.success) {
        await onReload(); // Ensure files are reloaded after rename
        onRename();
        setShowRenameDialog(false);
      } else {
        console.error("Failed to rename file");
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      // Optionally add error handling UI here
    }
  };

  const handleRemoveFile = async () => {
    if (!activeUser) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${node.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const result = await window.electron.removeFileorFolder(
        activeUser.id,
        activeUser.name,
        fullPath
      );

      if (result.success) {
        onDelete();
      } else {
        console.error("Failed to remove file or folder");
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Error removing file:", error);
      // You might want to show an error message to the user here
    }
  };

  if (node.type === "file") {
    return (
      <>
        <div
          style={{ paddingLeft }}
          className="flex items-center justify-between p-1.5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center">
            <File className="text-muted-foreground mr-2 text-sm" />
            <span className="text-sm text-foreground">{node.name}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {depth > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowRenameDialog(true)}
              >
                <Edit2 className="h-4 w-4 cursor-pointer hover:text-primary" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleRemoveFile}>
              <Trash2 className="h-4 w-4 cursor-pointer hover:text-destructive" />
            </Button>
          </div>
        </div>

        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogDescription />
            <DialogHeader>
              <DialogTitle>Rename File</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRename}>Rename</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div
        style={{ paddingLeft }}
        className="flex items-center justify-between p-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
      >
        <div
          className="flex items-center px-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <FolderOpen className="text-primary mr-2 text-sm" />
          ) : (
            <Folder className="text-primary mr-2 text-sm" />
          )}
          <span className="text-sm text-foreground">{node.name}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="outline" size="icon" onClick={handleOpenFolder}>
            <FolderOpen className="h-4 w-4 cursor-pointer hover:text-primary" />
          </Button>
          {depth > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowRenameDialog(true)}
            >
              <Edit2 className="h-4 w-4 cursor-pointer hover:text-primary" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleRemoveFile}>
            <Trash2 className="h-4 w-4 cursor-pointer hover:text-destructive" />
          </Button>
        </div>
      </div>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogDescription />
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isOpen &&
        node.children?.map((child, index) => (
          <FileItem
            key={`${child.name}-${index}`}
            node={child}
            depth={depth + 1}
            onDelete={onDelete}
            onRename={onRename}
            onReload={onReload}
            parentPath={fullPath}
          />
        ))}
    </>
  );
};

function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];

  files.forEach((filePath) => {
    const parts = filePath.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (!isLastPart) {
          currentLevel = existingNode.children || [];
        }
      } else {
        const newNode: FileNode = {
          name: part,
          type: isLastPart ? "file" : "folder",
          children: isLastPart ? undefined : [],
        };
        currentLevel.push(newNode);
        if (!isLastPart) {
          currentLevel = newNode.children!;
        }
      }
    });
  });

  return root;
}

export default function FileExplorer() {
  const { activeUser } = useUser();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveView } = useView();

  useEffect(() => {
    if (!activeUser) {
      setActiveView("SelectAccount");
    }
  }, [activeUser, setActiveView]);

  const loadFiles = useCallback(async () => {
    if (!activeUser) {
      return;
    }
    try {
      const result = await window.electron.getUserCollectionFiles(
        activeUser.id,
        activeUser.name
      );
      setFileTree(buildFileTree(result.files));
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  }, [activeUser]);

  useEffect(() => {
    loadFiles();
  }, [activeUser, loadFiles]);

  return (
    <div
      className="pt-5 h-[calc(100vh-1rem)] flex flex-col history-view"
      data-testid="history-view"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-2 bg-secondary/50 border-b border-secondary flex items-center justify-between">
          <div className="flex items-center">
            <FileIcon className="mr-2 h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">File Explorer</h1>
          </div>
          <Button variant="secondary" onClick={() => setActiveView("Chat")}>
            <ChevronLeftCircle className="h-4 w-4 cursor-pointer hover:text-primary" />
            Back to Chat
          </Button>
        </div>
        <div className="overflow-auto h-[calc(100%-2.5rem)] p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : fileTree.length > 0 ? (
            fileTree.map((node, index) => (
              <FileItem
                key={`${node.name}-${index}`}
                node={node}
                depth={0}
                onDelete={loadFiles}
                onRename={loadFiles}
                onReload={loadFiles}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Button onClick={() => setActiveView("Chat")}>
                  <ChevronLeftCircle className="h-4 w-4 cursor-pointer hover:text-primary" />
                  Back to Chat
                </Button>
                <span className="text-sm text-muted-foreground">
                  No files found
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
