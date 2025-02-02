import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/useUser";
import { useCallback, useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { useLibrary } from "@/context/useLibrary";

export default function DataStoreSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const { activeUser } = useUser();
  const {
    userCollections,
    selectedCollection,
    setShowAddStore,
    setSelectedCollection,
    setShowUpload,
    setFiles,
  } = useLibrary();

  const handleSelectCollection = async (collection: Collection) => {
    if (!activeUser) return;
    await window.electron.updateUserSettings({
      userId: activeUser.id,
      vectorstore: collection.id.toString(),
    });
    setSelectedCollection(collection);
    await loadFiles();
    setOpen(false);
    setShowUpload(true);
    toast({
      title: "Collection selected",
      description: `Selected collection: ${collection.name}`,
    });
  };

  const loadFiles = useCallback(async () => {
    if (!activeUser?.id || !activeUser?.name || !selectedCollection?.id) return;
    const fileList = await window.electron.getFilesInCollection(
      activeUser.id,
      selectedCollection.id
    );
    setFiles(fileList.files as unknown as string[]);
  }, [activeUser?.id, selectedCollection?.id, activeUser?.name, setFiles]);

  useEffect(() => {
    loadFiles();
  }, [selectedCollection, loadFiles]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background"
            >
              <span
                className={cn("truncate", !value && "text-muted-foreground")}
              >
                {selectedCollection?.name || "Select Data Store"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search stores..." />
              <CommandList>
                <CommandEmpty>No stores found.</CommandEmpty>
                <CommandGroup>
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => {
                      setShowAddStore(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Data Store
                  </Button>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      handleSelectCollection({
                        id: 0,
                        name: "No Store / Just Chat",
                        description: "",
                        type: "Chat",
                        files: "",
                        userId: activeUser?.id || 0,
                      });
                    }}
                  >
                    No Store / Just Chat
                  </CommandItem>
                </CommandGroup>
                <CommandGroup>
                  {userCollections.map((store) => (
                    <CommandItem
                      key={store.id}
                      value={store.name}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        handleSelectCollection(store);
                        setOpen(false);
                        setShowAddStore(false);
                      }}
                    >
                      {store.name}
                      {value === store.name && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
