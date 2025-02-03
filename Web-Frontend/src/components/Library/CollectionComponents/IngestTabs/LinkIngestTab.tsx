import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { IngestProgress } from "../IngestProgress";
import { implementedLinkTypes } from "../ingestTypes";
import { useState } from "react";

export function LinkIngestTab() {
  const [selectedLinkType, setSelectedLinkType] = useState<string | null>(null);
  const [link, setLink] = useState<string>("");
  const [ingesting, setIngesting] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {implementedLinkTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedLinkType === type.value ? "secondary" : "outline"}
            className="flex items-center justify-start space-x-2 h-12"
          >
            <span className="text-lg">{type.icon}</span>
            <div className="text-left">
              <p className="font-medium">{type.name}</p>
              <p className="text-xs text-muted-foreground">
                {type.description}
              </p>
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
            onClick={() => {}}
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
