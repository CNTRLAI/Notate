import { Button } from "@/src/components/ui/button";
import { MessageSquare } from "lucide-react";
import notateLogo from "@/assets/icon/icon.png";
import { useChatInput } from "@/src/context/useChatInput";
import { useLibrary } from "@/src/context/useLibrary";
import { docSuggestions, suggestions } from "./suggestions";
import Image from "next/image";

// Get a deterministic subset of suggestions based on the current day
const getDateBasedSuggestions = (arr: string[], count: number) => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const startIndex = dayOfYear % (arr.length - count);
  return arr.slice(startIndex, startIndex + count);
};

export function NewConvoWelcome() {
  const { handleChatRequest } = useChatInput();
  const { selectedCollection } = useLibrary();

  // Get 3 suggestions that will be the same on both server and client
  const selectedDocSuggestions = getDateBasedSuggestions(docSuggestions, 3);
  const selectedSuggestions = getDateBasedSuggestions(suggestions, 3);

  const handleSuggestionClick = (suggestion: string) => {
    handleChatRequest(selectedCollection?.id || undefined, suggestion);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="space-y-6 max-w-[600px]">
        <div className="space-y-2">
          <div className=" flex items-center justify-center mx-auto my-4">
            <Image
              src={notateLogo}
              alt="Notate Logo"
              className="w-12 h-12"
              width={48}
              height={48}
            />
          </div>
          <h2 className="text-2xl font-bold">Welcome to Notate</h2>
          <p className="text-muted-foreground">
            Your AI-powered knowledge assistant. Ask questions about your
            documents, videos, and web content.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            {selectedCollection && (
              <div className="grid gap-2">
                {selectedDocSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
            <div className="grid gap-2">
              {selectedSuggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
