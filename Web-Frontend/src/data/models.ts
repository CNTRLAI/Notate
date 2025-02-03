"use server";

import React from "react";
import { Model } from "../types/Models";
import db from "../lib/db";

export const fetchEmbeddingModels = async (
  setEmbeddingModels: React.Dispatch<React.SetStateAction<Model[]>>
) => {
  try {
    /*  const result = await window.electron.getEmbeddingsModels(); */
    return [
      {
        name: "OpenAI",
        type: "openai",
        model_location: "https://api.openai.com/v1/embeddings",
      },
    ];
  } catch (error) {
    console.error("Error fetching embedding models:", error);
    setEmbeddingModels([]);
  }
};

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
