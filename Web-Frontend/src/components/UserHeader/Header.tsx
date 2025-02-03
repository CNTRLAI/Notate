"use client";
import SettingsDialog from "../Settings/SettingsDialog";
import ToolsDialog from "../Tools/ToolsDialog";
import SearchBox from "../Search/Search";
import Logo from "@/assets/icon/icon.png";
import Image from "next/image";
export default function Header() {
  return (
    <header
      className={`bg-secondary/50 grid grid-cols-3 items-center border-b border-secondary`}
    >
      <div className="flex px-4 py-1">
        <Image src={Logo} alt="Logo" className="h-7 w-7 mr-2" /> Notate
      </div>
      <div>
        <SearchBox />
      </div>

      {/* Right column */}
      <div className="flex items-center justify-end">
        <ToolsDialog />
        <SettingsDialog />
      </div>
    </header>
  );
}
