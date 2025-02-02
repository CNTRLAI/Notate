import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import notateLogo from "@/assets/icon.png";
import { useChatInput } from "@/context/useChatInput";
import { useLibrary } from "@/context/useLibrary";
import { docSuggestions, suggestions } from "./suggestions";
import { useMemo } from "react";

export function NewConvoWelcome() {
  const { handleChatRequest } = useChatInput();
  const { selectedCollection, setSelectedCollection, setShowUpload } =
    useLibrary();

  const randomDocSuggestions = useMemo(() => {
    const shuffled = [...docSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, []);

  const randomSuggestions = useMemo(() => {
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    handleChatRequest(selectedCollection?.id || undefined, suggestion);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="space-y-6 max-w-[600px]">
        <div className="space-y-2">
          <div className=" flex items-center justify-center mx-auto my-4">
            <img src={notateLogo} alt="Notate Logo" className="w-12 h-12" />
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
              <p className="text-muted-foreground ">
                Your selected collection is
                <span className="pl-2 font-bold text-[#ffffff]">
                  {selectedCollection.name}
                </span>{" "}
                <button
                  className="text-red-500 hover:text-red-600"
                  onClick={() => {
                    setSelectedCollection(null);
                    setShowUpload(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </p>
            )}
            <div className="grid gap-2">
              {selectedCollection
                ? randomDocSuggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start text-left h-auto p-4 hover:bg-accent"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                      {suggestion}
                    </Button>
                  ))
                : randomSuggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start text-left h-auto p-4 hover:bg-accent"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
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
