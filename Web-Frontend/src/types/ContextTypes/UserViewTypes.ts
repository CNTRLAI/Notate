import React from "react";
import { View } from "@/src/types/view";
export interface UserViewContextType {
  activeView: View;
  setActiveView: React.Dispatch<React.SetStateAction<View>>;
}
