import { UserSettings } from "@/src/types/settings";
import db from "@/src/lib/db";
import { User } from "@/src/types/user";

export async function getUserPrompt(
  activeUser: User,
  userSettings: UserSettings,
  prompt: string | undefined
) {
  const getPrompt = await db.prompts.findUnique({
    where: {
      user_id: activeUser.id,
      id: Number(userSettings.promptId),
    },
  });
  if (getPrompt) {
    prompt = getPrompt.prompt;
  } else {
    prompt = "You are a helpful assistant.";
  }
  return prompt;
}
