import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useEffect } from "react";
import { useLibrary } from "@/context/useLibrary";
import { FilesInCollection } from "./FIlesInCollection";
import { FileTab } from "./IngestTabs/FileIngestTab";
import { LinkIngestTab } from "./IngestTabs/LinkIngestTab";
import { comingSoonFileTypes, implementedFileTypes } from "./ingestTypes";

export default function IngestModal({
  setShowUpload,
}: {
  setShowUpload?: (showUpload: boolean) => void;
}) {
  const {
    selectedCollection,
    openAddToCollection,
    loadFiles,
    handleDeleteCollection,
  } = useLibrary();

  useEffect(() => {
    if (openAddToCollection) {
      loadFiles();
    }
  }, [openAddToCollection, loadFiles]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              {setShowUpload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUpload(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Collection:
                </span>
                <span className="text-sm font-medium border border-primary/20 rounded-[6px] px-2 py-1 bg-primary/10 text-primary break-all">
                  {selectedCollection?.name}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteCollection}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Supported File Types</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {implementedFileTypes.map((ext) => (
                  <span
                    key={ext}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {ext}
                  </span>
                ))}
                {comingSoonFileTypes.map((ext) => (
                  <span
                    key={ext}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                  >
                    {ext} <span className="ml-1 text-[10px]">(Soon)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted rounded-[10px]">
          <TabsTrigger
            value="upload"
            className="rounded-l-[6px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Ingest Files
          </TabsTrigger>
          <TabsTrigger
            value="link"
            className="rounded-r-[6px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <span className="mr-2">🔗</span>
            Ingest From Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <FileTab />
        </TabsContent>
        <TabsContent value="link" className="space-y-4">
          <LinkIngestTab />
        </TabsContent>
      </Tabs>
      <FilesInCollection />
    </div>
  );
}
