import React from "react";

export const fetchEmbeddingModels = async (
  setEmbeddingModels: React.Dispatch<React.SetStateAction<Model[]>>
) => {
  try {
    const result = await window.electron.getEmbeddingsModels();
    if (result && result.models) {
      setEmbeddingModels(result.models);
    }
  } catch (error) {
    console.error("Error fetching embedding models:", error);
    setEmbeddingModels([]);
  }
};
