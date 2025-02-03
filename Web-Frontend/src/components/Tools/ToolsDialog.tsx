import { Button } from "@/src/components/ui/button";
import ToolboxIcon from "@/assets/toolbox/toolbox.svg";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import Tools from "@/src/components/Tools/Tools";
import Image from "next/image";

export default function ToolsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="clickable-header-section rounded-none"
        >
          <Image src={ToolboxIcon} alt="Toolbox" className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogDescription />
          <DialogTitle>Tools</DialogTitle>
        </DialogHeader>
        <Tools />
      </DialogContent>
    </Dialog>
  );
}
