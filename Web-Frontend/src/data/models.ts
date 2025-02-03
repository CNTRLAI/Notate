"use server";

import React from "react";
import { Model } from "../types/Models";

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
