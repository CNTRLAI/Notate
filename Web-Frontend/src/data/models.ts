"use server";

import db from "../lib/db";


export const getOpenRouterModels = async (userId: number) => {
  const models = await db.openrouter_models.findMany({
    where: {
      user_id: userId,
    },
  });
  return models;
};

export const getAzureOpenAIModels = async (userId: number) => {
  const models = await db.azure_openai_models.findMany({
    where: {
      user_id: userId,
    },
  });
  return models;
};

export const getCustomModels = async (userId: number) => {
  const models = await db.custom_api.findMany({
    where: {
      user_id: userId,
    },
  });
  return models;
};
