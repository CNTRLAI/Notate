import db from "../../db.js";

export async function getUserPrompt(
  activeUser: User,
  userSettings: UserSettings,
  prompt: string | undefined
) {
  const getPrompt = await db.getUserPrompt(
    activeUser.id,
    Number(userSettings.promptId)
  );
  if (getPrompt) {
    prompt = getPrompt.prompt;
  } else {
    prompt = "You are a helpful assistant.";
  }
  return prompt;
}
