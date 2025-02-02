import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Scroll,
  Search,
  Calendar,
  Trash2,
  ChevronLeftCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/useUser";
import { useView } from "@/context/useView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    conversations,
    setConversations,
    activeUser,
    setActiveConversation,
    setMessages,
  } = useUser();
  const { setActiveView } = useView();

  useEffect(() => {
    if (!activeUser) {
      setActiveView("SelectAccount");
    }
  }, [activeUser, setActiveView]);

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    conversationId: number
  ) => {
    e.stopPropagation();
    if (!activeUser) {
      return;
    }
    try {
      await window.electron.deleteConversation(activeUser.id, conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSelectConversation = async (conversationId: number) => {
    setActiveConversation(conversationId);
    if (!activeUser) {
      return;
    }
    try {
      const result = await window.electron.getConversationMessages(
        activeUser.id,
        conversationId
      );
      setMessages(result.messages);
      setActiveView("Chat");
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  return (
    <div
      className="pt-5 h-[calc(100vh-1rem)] flex flex-col history-view"
      data-testid="history-view"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-2 bg-secondary/50 border-b border-secondary flex items-center justify-between">
          <div className="flex items-center">
            <Scroll className="mr-2 h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Chat History</h1>
          </div>
          <Button variant="secondary" onClick={() => setActiveView("Chat")}>
            <ChevronLeftCircle className="h-4 w-4 cursor-pointer hover:text-primary" />
            Back to Chat
          </Button>
        </div>

        {conversations.length === 0 ? (
          <div className="p-4">
            <Alert>
              <AlertTitle>No conversations found</AlertTitle>
              <AlertDescription className="flex flex-col gap-4">
                <p>You haven't started any conversations yet.</p>
                <Button
                  onClick={() => {
                    setMessages([]);
                    setActiveConversation(null);
                    setActiveView("Chat");
                  }}
                >
                  Start a New Chat
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-secondary">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 rounded-[8px] border border-input bg-background 
                           focus-visible:ring-1 focus-visible:ring-ring"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea
              className="flex-grow px-4 scroll-area"
              data-testid="history-scroll-area"
              style={{ height: "calc(100% - 8rem)" }}
            >
              <div className="grid gap-4 py-4">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="bg-card rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer
                             border border-border"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col m-">
                        <h3 className="font-medium text-lg text-foreground">
                          {conversation.title || "Untitled Conversation"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-4 h-4" />
                          {format(
                            new Date(conversation.created_at || Date.now()),
                            "MMM d, yyyy"
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) =>
                            handleDeleteConversation(e, conversation.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
