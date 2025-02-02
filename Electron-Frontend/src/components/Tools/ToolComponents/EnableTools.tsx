import { Button } from "@/components/ui/button";
import { useUser } from "@/context/useUser";
import { Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSysSettings } from "@/context/useSysSettings";
import { Separator } from "@/components/ui/separator";

const toolIcons = {
  "Web Search": <Globe />,
};

export default function EnableTools() {
  const { dockTool, systemTools, userTools, activeUser } = useUser();
  const { settings, setSettings } = useSysSettings();

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-col space-y-4">
        <div className="text-sm font-medium">Select Tools</div>
        <div className="grid grid-cols-3 gap-2">
          {systemTools.map((tool) => {
            const userTool = userTools.find((t) => t.name === tool.name);
            return (
              <div
                key={tool.name}
                className="flex flex-col gap-2 items-center justify-center"
              >
                <Button
                  variant={userTool?.docked === 1 ? "secondary" : "outline"}
                  className="w-full h-full"
                  onClick={() =>
                    dockTool(
                      userTool || {
                        ...tool,
                        enabled: 1,
                        docked: 1,
                      }
                    )
                  }
                >
                  {toolIcons[tool.name as keyof typeof toolIcons] || tool.name}
                  {tool.name}
                </Button>
              </div>
            );
          })}

          <Button variant="outline" disabled>
            More Coming Soon
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="cot">Chain of Thought / Reasoning</Label>
            <div className="text-[0.8rem] text-muted-foreground">
              Enable to add a chain of thought / reasoning to the model's
              response
            </div>
          </div>
          <Switch
            id="cot"
            disabled={settings.model === "deepseek-reasoner"}
            checked={settings.cot === 1}
            onCheckedChange={(checked) => {
              if (activeUser) {
                window.electron.updateUserSettings({
                  userId: activeUser.id,
                  cot: checked ? 1 : 0,
                });
              }
              setSettings((prev) => ({ ...prev, cot: checked ? 1 : 0 }));
            }}
          />
        </div>
        <div className="rounded-[6px] bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-yellow-500">Beta</span>
            These tools are currently in development and may not work as
            expected with all models.
          </div>
        </div>
      </div>
    </div>
  );
}
