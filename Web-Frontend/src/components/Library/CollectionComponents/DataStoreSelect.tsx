import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useCallback, useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";

import { Collection } from "@/src/types/collection";

export default function DataStoreSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSelectCollection = async (collection: Collection) => {
    console.log(collection);
  };

  const loadFiles = useCallback(async () => {
    console.log("loadFiles");
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const selectedCollection = { id: 0, name: "Test Collection" };
  const [showAddStore, setShowAddStore] = useState(false);
  const userCollections: Collection[] = [];
  const activeUser = { id: 0 };
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
