import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { MessageSquare, Cpu, Settings2 } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

export function SettingsModal() {
  return (
    <Tabs defaultValue="chat" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted p-1 rounded-lg">
        <TabsTrigger value="chat">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <p className="hidden md:block">Chat Settings</p>
          </div>
        </TabsTrigger>
        <TabsTrigger value="llm">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <p className="hidden md:block">LLM Integration</p>
          </div>
        </TabsTrigger>
        <TabsTrigger value="system">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Dev Integration
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
              key="chat-tab"
              value="chat"
              className="h-full m-0 border-none outline-none overflow-y-hidden"
            >
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-auto p-6 overflow-y-hidden"
              ></motion.div>
            </TabsContent>
            <TabsContent
              key="llm-tab"
              value="llm"
              className="h-full m-0 border-none outline-none"
            >
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-auto p-6 overflow-y-hidden"
              ></motion.div>
            </TabsContent>
            <TabsContent
              key="system-tab"
              value="system"
              className="h-full m-0 border-none outline-none"
            >
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-auto p-6"
              ></motion.div>
            </TabsContent>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </Tabs>
  );
}
