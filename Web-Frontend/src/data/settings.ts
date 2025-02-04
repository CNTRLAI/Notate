"use server";

import db from "@/src/lib/db";
import { UserSettings } from "@/src/types/settings";
import { Prisma } from "@prisma/client";

export const getSettings = async () => {
  const settings = await db.settings.findMany();
  return settings;
};

export const createSetting = async (setting: UserSettings, user_id: number) => {
  const newSetting = await db.settings.create({
    data: {
      provider: String(setting.provider || "openai"),
      model: String(setting.model || "gpt-3.5-turbo"),
      promptId: String(setting.promptId || "1"),
      user_id: Number(user_id),
      temperature: Number(setting.temperature || 0.7),
      vectorstore: String(setting.vectorstore || "default"),
      maxTokens: Number(setting.maxTokens || 2000),
      modelDirectory: String(setting.modelDirectory || ""),
      modelType: String(setting.modelType || "cloud"),
      modelLocation: String(setting.modelLocation || "openai"),
      ollamaModel: String(setting.ollamaModel || ""),
      baseUrl: String(setting.baseUrl || ""),
      selectedAzureId: Number(setting.selectedAzureId || 0),
      selectedCustomId: Number(setting.selectedCustomId || 0),
    },
  });
  return newSetting;
};

export const updateSetting = async (setting: UserSettings, user_id: number) => {
  try {
    // First check if user has any settings
    const existingSettings = await db.settings.findFirst({
      where: { user_id: Number(user_id) },
    });

    if (existingSettings) {
      // Create an object to hold only the fields that should be updated
      const updateData: Prisma.settingsUpdateInput = {};

      // Only add fields that have valid values
      if (setting.provider !== undefined && setting.provider !== "")
        updateData.provider = String(setting.provider);
      if (setting.model !== undefined && setting.model !== "")
        updateData.model = String(setting.model);
      if (setting.promptId !== undefined && setting.promptId !== "")
        updateData.promptId = String(setting.promptId);
      if (setting.temperature !== undefined)
        updateData.temperature = Number(setting.temperature);
      if (setting.vectorstore !== undefined && setting.vectorstore !== "")
        updateData.vectorstore = String(setting.vectorstore);
      if (setting.maxTokens !== undefined)
        updateData.maxTokens = Number(setting.maxTokens);
      if (setting.modelDirectory !== undefined && setting.modelDirectory !== "")
        updateData.modelDirectory = String(setting.modelDirectory);
      if (setting.modelType !== undefined && setting.modelType !== "")
        updateData.modelType = String(setting.modelType);
      if (setting.modelLocation !== undefined && setting.modelLocation !== "")
        updateData.modelLocation = String(setting.modelLocation);
      if (setting.ollamaModel !== undefined && setting.ollamaModel !== "")
        updateData.ollamaModel = String(setting.ollamaModel);
      if (setting.baseUrl !== undefined && setting.baseUrl !== "")
        updateData.baseUrl = String(setting.baseUrl);
      if (setting.selectedAzureId !== undefined)
        updateData.selectedAzureId = Number(setting.selectedAzureId);
      if (setting.selectedCustomId !== undefined)
        updateData.selectedCustomId = Number(setting.selectedCustomId);
      if (setting.ollamaIntegration !== undefined)
        updateData.ollamaIntegration = Number(setting.ollamaIntegration);
      if (setting.cot !== undefined) updateData.cot = Number(setting.cot);
      if (setting.webSearch !== undefined)
        updateData.webSearch = Number(setting.webSearch);

      // Only perform update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        const updatedSetting = await db.settings.update({
          where: { id: existingSettings.id },
          data: updateData,
        });
        return updatedSetting;
      }
      return existingSettings;
    } else {
      // For new settings, use default values
      const baseData = {
        provider: String(setting.provider ?? "openai"),
        model: String(setting.model ?? "gpt-3.5-turbo"),
        promptId: setting.promptId ? String(setting.promptId) : "default",
        temperature: Number(setting.temperature ?? 0.7),
        vectorstore: String(setting.vectorstore ?? "default"),
        maxTokens: Number(setting.maxTokens ?? 2000),
        modelDirectory: String(setting.modelDirectory ?? ""),
        modelType: String(setting.modelType ?? "cloud"),
        modelLocation: String(setting.modelLocation ?? "openai"),
        ollamaModel: String(setting.ollamaModel ?? ""),
        baseUrl: String(setting.baseUrl ?? ""),
        selectedAzureId: Number(setting.selectedAzureId ?? 0),
        selectedCustomId: Number(setting.selectedCustomId ?? 0),
        ollamaIntegration: Number(setting.ollamaIntegration ?? 0),
        cot: Number(setting.cot ?? 0),
        webSearch: Number(setting.webSearch ?? 0),
      };

      const newSetting = await db.settings.create({
        data: {
          ...baseData,
          user: {
            connect: {
              id: Number(user_id),
            },
          },
        },
      });
      return newSetting;
    }
  } catch (error) {
    // Log the error stack instead of the error object directly
    if (error instanceof Error) {
      console.error("Error in user creation process - Stack:", error.stack);
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      console.error("Unknown error in user creation process");
      throw new Error("Failed to create user: Unknown error");
    }
  }
};

export const deleteSetting = async (id: number) => {
  const deletedSetting = await db.settings.delete({
    where: { id },
  });
  return deletedSetting;
};

export const getSettingById = async (user_id: number) => {
  const setting = await db.settings.findFirst({
    where: { user_id: user_id },
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

export const getPromptById = async (id: number) => {
  const prompt = await db.prompts.findUnique({
    where: { id },
  });
  return prompt;
};
