import { useUser } from "@/context/useUser";
import { Loader2 } from "lucide-react";

export function LoadingIndicator() {
  const { streamingMessage } = useUser();
  return (
    <div className="flex justify-center my-4">
      <div className="flex items-center bg-secondary/50 text-secondary-foreground rounded-full px-4 py-2 shadow-md">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">
          {streamingMessage ? "AI is processing" : "Thinking"}
          <span className="inline-flex">
            <span className="animate-[dot_1.4s_infinite] [animation-delay:0.0s]">.</span>
            <span className="animate-[dot_1.4s_infinite] [animation-delay:0.2s]">.</span>
            <span className="animate-[dot_1.4s_infinite] [animation-delay:0.4s]">.</span>
          </span>
        </span>
      </div>
    </div>
  );
}
