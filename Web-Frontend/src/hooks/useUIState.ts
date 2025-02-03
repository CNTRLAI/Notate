import { useEffect, useRef, useState } from "react";
export const useUIState = () => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [alertForUser, setAlertForUser] = useState<boolean>(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return {
    isSearchOpen,
    setIsSearchOpen,
    searchTerm,
    setSearchTerm,
    searchRef,
    alertForUser,
    setAlertForUser,
  };
};
