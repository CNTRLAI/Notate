import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { useEffect, useState } from "react";

export function IngestProgress({ truncate }: { truncate?: boolean }) {
  const [showProgress, setShowProgress] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [localMessage, setLocalMessage] = useState(progressMessage);
  const [localProgress, setLocalProgress] = useState(progress);
  const handleCancelWebcrawl = async () => {};
  useEffect(() => {
    if (showProgress) {
      setLocalMessage(progressMessage);
      setLocalProgress(progress);
    }
  }, [progressMessage, progress, showProgress]);

  if (!showProgress) {
    return null;
  }

  return (
    <div className="w-full">
      <div className={`rounded-[10px] shadow-lg p-1`}>
        <div className="flex items-center gap-2 w-full">
          <div className="flex-grow min-w-0">
            <p
              className={`${
                truncate ? "text-[8px] md:text-xs" : "text-xs"
              } text-secondary-foreground mb-1 break-all`}
            >
              {truncate ? localMessage.slice(0, 60) + "..." : localMessage}
            </p>
            <Progress value={localProgress} className="h-1" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              handleCancelWebcrawl();
              setShowProgress(false);
            }}
            className="p-1 h-6"
            title="Cancel"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
