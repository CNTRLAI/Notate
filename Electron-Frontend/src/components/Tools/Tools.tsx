import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ToolboxIcon from "@/assets/toolbox/toolbox.svg";
import EnableTools from "./ToolComponents/EnableTools";
import AddTools from "./ToolComponents/AddTools";

export default function Tools() {
  return (
    <Tabs defaultValue="sysTools" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted p-1 rounded-[8px]">
        <TabsTrigger value="sysTools">
          <div className="flex items-center gap-2">
            <img src={ToolboxIcon} alt="Toolbox" className="h-4 w-4" />
            <p className="hidden md:block">Tools</p>
          </div>
        </TabsTrigger>
        <TabsTrigger value="addTools">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <p className="hidden md:block">Add Tools</p>
          </div>
        </TabsTrigger>
      </TabsList>
      <motion.div
        layout
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="flex-1 overflow-hidden"
      >
        <LayoutGroup>
          <AnimatePresence mode="sync">
            <TabsContent
              key="sysTools-tab"
              value="sysTools"
              className="h-full m-0 border-none outline-none overflow-y-hidden"
            >
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-auto py-6 overflow-y-hidden"
              >
                <EnableTools />
              </motion.div>
            </TabsContent>
            <TabsContent
              key="addTools-tab"
              value="addTools"
              className="h-full m-0 border-none outline-none"
            >
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-auto py-6 overflow-y-hidden"
              >
                <AddTools />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </Tabs>
  );
}
