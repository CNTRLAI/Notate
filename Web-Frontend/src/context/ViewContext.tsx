"use client";

import React, { createContext, useState } from "react";
import { View } from "../types/view";
import { UserViewContextType } from "../types/ContextTypes/UserViewTypes";

const ViewContext = createContext<UserViewContextType | undefined>(undefined);

const ViewProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeView, setActiveView] = useState<View>("Chat");

  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ViewContext.Provider>
  );
};

export { ViewProvider, ViewContext };
