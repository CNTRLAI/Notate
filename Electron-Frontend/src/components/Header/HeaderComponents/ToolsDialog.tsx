import { Button } from "@/components/ui/button";
import ToolboxIcon from "@/assets/toolbox/toolbox.svg";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Tools from "@/components/Tools/Tools";

export default function ToolsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="clickable-header-section rounded-none"
        >
          <img src={ToolboxIcon} alt="Toolbox" className="h-4 w-4" />
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
