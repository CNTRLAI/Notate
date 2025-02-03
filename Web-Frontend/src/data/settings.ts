"use server";

import db from "@/src/lib/db";
import { UserSettings } from "@/src/types/settings";

export const getSettings = async () => {
  const settings = await db.settings.findMany();
  return settings;
};

export const createSetting = async (setting: UserSettings, user_id: number) => {
  const newSetting = await db.settings.create({
    data: {
      model: setting.model || "gpt-3.5-turbo",
      promptId: "0",
      user_id: user_id,
      temperature: setting.temperature || 0.7,
      vectorstore: setting.vectorstore || "default",
      maxTokens: setting.maxTokens || 2000,
      modelDirectory: setting.modelDirectory || "",
      modelType: setting.modelType || "cloud",
      modelLocation: setting.modelLocation || "openai",
      ollamaModel: setting.ollamaModel || "",
      baseUrl: setting.baseUrl || "",
      selectedAzureId: setting.selectedAzureId || 0,
      selectedCustomId: setting.selectedCustomId || 0,
    },
  });
  return newSetting;
};

export const updateSetting = async (setting: UserSettings, user_id: number) => {
  const updatedSetting = await db.settings.update({
    where: { id: setting.id },
    data: {
      model: setting.model || "gpt-3.5-turbo",
      promptId: "0",
      user_id: user_id,
      temperature: setting.temperature || 0.7,
      vectorstore: setting.vectorstore || "default",
      maxTokens: setting.maxTokens || 2000,
      modelDirectory: setting.modelDirectory || "",
      modelType: setting.modelType || "cloud",
      modelLocation: setting.modelLocation || "openai",
      ollamaModel: setting.ollamaModel || "",
      baseUrl: setting.baseUrl || "",
      selectedAzureId: setting.selectedAzureId || 0,
      selectedCustomId: setting.selectedCustomId || 0,
    },
  });
  return updatedSetting;
};

export const deleteSetting = async (id: number) => {
  const deletedSetting = await db.settings.delete({
    where: { id },
  });
  return deletedSetting;
};

export const getSettingById = async (id: number) => {
  const setting = await db.settings.findUnique({
    where: { id },
  });
  return setting;
};

export const getUserPrompts = async (user_id: number) => {
  const prompts = await db.prompts.findMany({
    where: { user_id },
  });
  return prompts;
};

export const addUserPrompt = async (
  user_id: number,
  name: string,
  prompt: string
) => {
  const newPrompt = await db.prompts.create({
    data: { user_id, name, prompt },
  });
  return newPrompt;
};
