import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useView } from "@/context/useView";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/useUser";
import { useSysSettings } from "@/context/useSysSettings";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const MotionAvatar = motion.create(Avatar);

export default function SelectAccount({ users }: { users: User[] }) {
  const { setActiveView } = useView();
  const { activeUser, setActiveUser } = useUser();
  const { setSettings } = useSysSettings();

  const fetchSettings = async () => {
    if (activeUser) {
      const userSettings = await window.electron.getUserSettings(activeUser.id);
      setSettings(userSettings);
    }
  };

  const handleSelectAccount = (user: User) => {
    setActiveUser(user);
    fetchSettings();
    setActiveView("Chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-muted/50">
      <motion.div
        className="w-full max-w-md mx-auto pt-12 flex flex-col h-screen pb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex-none space-y-3 mb-8 px-6">
          <div className="flex items-center justify-between mb-5">
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"
            >
              Select Account
            </motion.h1>
            <motion.div variants={itemVariants}>
              <Button
                onClick={() => setActiveView("Signup")}
                className="group px-4 h-10 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                New Account
              </Button>
            </motion.div>
          </div>
          <motion.p
            variants={itemVariants}
            className="text-sm text-muted-foreground"
          >
            Choose your account to access your workspace
          </motion.p>
        </div>

        <motion.div
          className="relative flex-1 px-4 min-h-0"
          variants={itemVariants}
        >
          <div className="absolute inset-0 pb-12">
            <div className="h-full rounded-[10px] bg-background/50 backdrop-blur-sm border border-border/50 shadow-sm">
              <ScrollArea className="h-full px-4 py-4">
                <div className="flex flex-col h-full">
                  <div className="grid auto-rows-min grid-cols-1 gap-3 py-1 px-1 grow">
                    {users.map((user) => (
                      <motion.div
                        key={user.name}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="py-0.5"
                      >
                        <Card
                          className="group transition-all duration-300 cursor-pointer border border-border/50 bg-card/95 hover:shadow-lg hover:border-primary/20"
                          onClick={() => handleSelectAccount(user)}
                        >
                          <CardContent className="flex items-center p-5">
                            <MotionAvatar
                              className="h-10 w-10 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300"
                              initial="hidden"
                              animate="visible"
                            >
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm group-hover:bg-primary/20 transition-colors duration-300">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </MotionAvatar>
                            <div className="ml-4 min-w-0 flex-1">
                              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors duration-300">
                                {user.name}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                Click to access workspace
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
