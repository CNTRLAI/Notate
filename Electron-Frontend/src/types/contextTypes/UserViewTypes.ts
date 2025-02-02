import React from "react";

export interface UserViewContextType {
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
}
