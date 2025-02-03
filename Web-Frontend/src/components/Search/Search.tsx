import { SearchIcon, Search } from "lucide-react";
import { useState, useRef } from "react";

// mock data
const conversations = [
  { id: 1, title: "Conversation 1" },
  { id: 2, title: "Conversation 2" },
  { id: 3, title: "Conversation 3" },
];

export default function SearchBox() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleConversationClick = (conversationId: number) => {
    console.log("Conversation clicked:", conversationId);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };
  return (
    <div className="flex justify-center items-center">
      <div
        ref={searchRef}
        className="clickable-header-section outer-glow flex justify-center items-center border-2 box-shadow-inner rounded-[6px] w-[90%] rounded hover:bg-secondary/50 relative"
        onClick={toggleSearch}
      >
        {isSearchOpen ? (
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              className="px-2 w-full bg-transparent text-sm text-gray-300 outline-none"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={14}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300"
            />
            {isSearchOpen && (
              <div className="absolute top-full left-0 w-full bg-secondary/90 rounded-b-[6px] max-h-60 overflow-x-hidden overflow-y-auto z-50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="px-2 py-1 hover:bg-secondary/50 cursor-pointer text-sm text-gray-300"
                    onClick={() => handleConversationClick(conv.id)}
                  >
                    {conv.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h1 className="text-sm text-gray-300 flex items-center gap-2 px-4">
            <SearchIcon size={14} /> Notate
          </h1>
        )}
      </div>
    </div>
  );
}
