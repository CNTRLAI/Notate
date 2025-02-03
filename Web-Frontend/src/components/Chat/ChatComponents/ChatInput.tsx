import { Library } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Send, X, Loader2, Mic, Globe } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/src/components/ui/textarea";

interface UserTool {
  id: number;
  name: string;
  enabled: number;
  docked: number;
}



export default function ChatInput() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const [openLibrary, setOpenLibrary] = useState(false);
  const [userTools, setUserTools] = useState<UserTool[]>([]);
  const [loadingDots, setLoadingDots] = useState("");
  const [isFFMPEGInstalled, setIsFFMPEGInstalled] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleRecording = () => {
    // TODO: Implement recording functionality
  };

  return (
    <div className="p-4 bg-card border-t border-secondary">
      <form onSubmit={handleSubmit} className="flex w-full items-center">
        <div className="flex flex-col items-center">
          <Dialog open={openLibrary} onOpenChange={setOpenLibrary}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="flex-shrink-0 rounded-none rounded-tl-[6px]"
              >
                <Library className="h-5 w-5" />
                <span className="sr-only">Library</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[100vh] mt-4 overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle>Data Store Library</DialogTitle>
                <DialogDescription />
              </DialogHeader>
            
            </DialogContent>
          </Dialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  disabled={transcriptionLoading}
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={handleRecording}
                  className="flex-shrink-0 rounded-none rounded-bl-[6px] relative"
                >
                  {transcriptionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Mic
                      className={`h-5 w-5 ${
                        isRecording ? "animate-pulse" : ""
                      } ${!isFFMPEGInstalled ? "opacity-50" : ""}`}
                    />
                  )}
                  {isRecording && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 z-20 animate-pulse" />
                  )}
                  <span className="sr-only">
                    {transcriptionLoading
                      ? "Transcribing..."
                      : isRecording
                      ? "Stop Recording"
                      : "Start Recording"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="absolute right-14 bottom-12 z-50">
          {userTools.map((tool) => (
            <Button
              type="button"
              key={tool.id}
              size="icon"
              variant={tool.enabled === 1 ? "secondary" : "outline"}
              className={`${tool.enabled === 1 ? "opacity-100" : "opacity-40"}`}
            >
              {tool.name === "Web Search" ? <Globe /> : <></>}
            </Button>
          ))}
        </div>
        <Textarea
          placeholder="Type your message here..."
          value={transcriptionLoading ? `Transcribing${loadingDots}` : input}
          onChange={(e) => setInput(e.target.value)}
          disabled={transcriptionLoading}
          data-testid="chat-input"
          className={`z-10 max-h-[72px] min-h-[72px] flex-grow bg-background text-foreground placeholder-muted-foreground border-secondary rounded-none transition-opacity duration-200 [overflow-wrap:anywhere] ${
            transcriptionLoading ? "opacity-50" : "opacity-100"
          }`}
        />
        <Button
          type="submit"
          size="icon"
          variant={isLoading ? "destructive" : "outline"}
          data-testid="chat-submit"
          className="flex-shrink-0 h-[72px] w-[36px] rounded-none rounded-r-[6px]"
        >
          {isLoading ? <X className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">{isLoading ? "Cancel" : "Send"}</span>
        </Button>
      </form>
    </div>
  );
}
