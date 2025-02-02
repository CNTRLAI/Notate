import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { useUser } from "@/context/useUser";
import { toast } from "@/hooks/use-toast";
import { IngestProgress } from "../IngestProgress";
import { implementedLinkTypes } from "../ingestTypes";
import { useLibrary } from "@/context/useLibrary";

export function LinkIngestTab() {
  const { activeUser } = useUser();
  const {
    selectedCollection,
    loadFiles,
    setProgressMessage,
    setProgress,
    setShowProgress,
    setIngesting,
    ingesting,
    setSelectedLinkType,
    selectedLinkType,
    link,
    setLink,
  } = useLibrary();

  const handleSubmit = async () => {
    setIngesting(true);
    if (!selectedLinkType) {
      toast({
        title: "Error",
        description: "Please select a link type",
        variant: "destructive",
      });
      return;
    }
    if (selectedLinkType === "crawl" || selectedLinkType === "documentation") {
      if (!activeUser?.id || !selectedCollection?.id || !link) {
        toast({
          title: "Error",
          description: "Missing required information",
          variant: "destructive",
        });
        return;
      }
      try {
        setShowProgress(true);
        setProgress(0);
        setProgressMessage("Starting web crawl...");

        const result = await window.electron.webcrawl({
          base_url: link,
          user_id: activeUser.id,
          user_name: activeUser.name,
          collection_id: selectedCollection.id,
          collection_name: selectedCollection.name,
          max_workers: 1,
        });

        if (result) {
          toast({
            title: "Success",
            description: "Web crawl completed",
          });

          setLink("");
          setSelectedLinkType(null);
          loadFiles();

          setTimeout(() => {
            setShowProgress(false);
            setProgress(0);
            setProgressMessage("");
            setIngesting(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Error crawling website:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to crawl website",
          variant: "destructive",
        });
      }
    } else if (selectedLinkType === "youtube") {
      if (!activeUser?.id || !selectedCollection?.id || !link) {
        toast({
          title: "Error",
          description: "Missing required information",
          variant: "destructive",
        });
        return;
      }

      try {
        setProgressMessage("Starting YouTube video processing...");
        setProgress(0);
        setShowProgress(true);

        const result = await window.electron.youtubeIngest(
          link,
          activeUser.id,
          activeUser.name,
          selectedCollection.id,
          selectedCollection.name
        );

        if (result) {
          setProgressMessage("YouTube video processed successfully!");
          setProgress(100);
          toast({
            title: "Success",
            description: "YouTube video processed successfully",
          });

          setLink("");
          setSelectedLinkType(null);
          loadFiles();
          setTimeout(() => {
            setShowProgress(false);
            setProgress(0);
            setProgressMessage("");
            setIngesting(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Error processing YouTube video:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process YouTube video",
          variant: "destructive",
        });
        setIngesting(false);
        setProgressMessage("");
        setProgress(0);
        setShowProgress(false);
      }
    } else if (selectedLinkType === "website") {
      if (!activeUser?.id || !selectedCollection?.id || !link) {
        toast({
          title: "Error",
          description: "Missing required information",
          variant: "destructive",
        });
        return;
      }

      try {
        setProgressMessage("Starting website fetch...");
        setProgress(0);
        setShowProgress(true);

        const result = await window.electron.websiteFetch(
          link,
          activeUser.id,
          activeUser.name,
          selectedCollection.id,
          selectedCollection.name
        );

        if (result.success) {
          setProgressMessage("Website processed successfully!");
          setProgress(100);
          toast({
            title: "Success",
            description: "Website processed successfully",
          });
          setLink("");
          setSelectedLinkType(null);
          loadFiles();
          setTimeout(() => {
            setIngesting(false);
            setShowProgress(false);
            setProgress(0);
            setProgressMessage("");
          }, 2000);
        } else {
          throw new Error(result.success || "Failed to process website");
        }
      } catch (error) {
        console.error("Error processing website:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process website",
          variant: "destructive",
        });
        setProgressMessage("");
        setProgress(0);
        setShowProgress(false);
        setIngesting(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {implementedLinkTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedLinkType === type.value ? "secondary" : "outline"}
            onClick={() =>
              setSelectedLinkType(type.value as "website" | "youtube" | "crawl")
            }
            className="flex items-center justify-start space-x-2 h-12"
          >
            <span className="text-lg">{type.icon}</span>
            <div className="text-left">
              <p className="font-medium">{type.name}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </Button>
        ))}
      </div>

      {selectedLinkType && (
        <div className="space-y-2">
          <Input
            placeholder={`Enter ${selectedLinkType} URL...`}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="h-10"
          />
          <Button
            onClick={handleSubmit}
            disabled={!link || ingesting}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />

            {selectedLinkType === "youtube" ? (
              <>
                {ingesting ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2">
                      <Loader2 className="h-4 w-4" />
                    </span>
                    Ingesting Video...
                  </span>
                ) : (
                  "Ingest Video"
                )}
              </>
            ) : selectedLinkType === "documentation" ? (
              <>
                {ingesting ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2">
                      <Loader2 className="h-4 w-4" />
                    </span>
                    Ingesting Documentation...
                  </span>
                ) : (
                  "Ingest Documentation"
                )}
              </>
            ) : selectedLinkType === "crawl" ? (
              <>
                {ingesting ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2">
                      <Loader2 className="h-4 w-4" />
                    </span>
                    Crawling & Ingesting...
                  </span>
                ) : (
                  "Web Crawl & Ingest"
                )}
              </>
            ) : (
              <>
                {ingesting ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2">
                      <Loader2 className="h-4 w-4" />
                    </span>
                    Ingesting Page...
                  </span>
                ) : (
                  "Ingest Page"
                )}
              </>
            )}
          </Button>
        </div>
      )}
      <IngestProgress />
    </div>
  );
} 