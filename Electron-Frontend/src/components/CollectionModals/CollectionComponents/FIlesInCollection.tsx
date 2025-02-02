import { Button } from "@/components/ui/button";
import {
  File,
  Library,
  Globe,
  Youtube,
  FileText,
  ChevronDown,
} from "lucide-react";

import { processFiles } from "@/lib/utils";
import { useLibrary } from "@/context/useLibrary";
import { cn } from "@/lib/utils";

const truncateFileName = (fileName: string) => {
  if (fileName.length <= 30) return fileName;
  const start = fileName.slice(0, 13);
  const end = fileName.slice(-14);
  return `${start}...${end}`;
};

export function FilesInCollection() {
  const { files, fileExpanded, setFileExpanded } = useLibrary();
  const filesList = processFiles(files);

  return (
    <div className="rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Library className="h-4 w-4" />
            Files in collection ({filesList.length})
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setFileExpanded(!fileExpanded)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", fileExpanded ? "rotate-180" : "")} />
          <span className="ml-2">{fileExpanded ? "Hide" : "Show"}</span>
        </Button>
      </div>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          fileExpanded ? "max-h-48 overflow-y-auto" : "max-h-0"
        )}
      >
        {filesList.length > 0 ? (
          <ul className="space-y-1">
            {filesList.map((file, index) => {
              const isUrl = file.startsWith("http");
              const isYoutube =
                file.includes("youtube.com") || file.includes("youtu.be");
              const fileExtension = !isUrl
                ? file.split(".").pop()?.toLowerCase()
                : null;

              let icon = <File className="h-4 w-4 mr-2 flex-shrink-0" />;
              if (isYoutube) {
                icon = (
                  <Youtube className="h-4 w-4 mr-2 flex-shrink-0 text-red-500" />
                );
              } else if (isUrl) {
                icon = (
                  <Globe className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                );
              } else if (fileExtension === "md") {
                icon = (
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                );
              } else if (fileExtension === "py") {
                icon = (
                  <File className="h-4 w-4 mr-2 flex-shrink-0 text-yellow-500" />
                );
              } else if (fileExtension === "txt") {
                icon = (
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                );
              }

              return (
                <li
                  key={index}
                  className="flex items-center text-sm text-muted-foreground py-1.5 px-2 rounded-[4px] hover:bg-secondary/80 group"
                >
                  {icon}
                  <span className="truncate group-hover:text-clip">
                    {isUrl ? (
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate"
                        title={file}
                      >
                        {truncateFileName(file)}
                      </a>
                    ) : (
                      <span title={file}>{truncateFileName(file)}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No files in collection
          </p>
        )}
      </div>
    </div>
  );
}
