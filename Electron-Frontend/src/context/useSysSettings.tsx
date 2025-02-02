import { useContext } from "react";
import { SysSettingsContext } from "./SysSettingsContext";

export const useSysSettings = () => {
  const context = useContext(SysSettingsContext);
  if (context === undefined) {
    throw new Error("useSysSettings must be used within a SysSettingsProvider");
  }
  return context;
};
