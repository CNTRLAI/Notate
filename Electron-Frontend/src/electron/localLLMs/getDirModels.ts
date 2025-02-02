import fs from "fs";
import path from "path";

export async function getDirModels(payload: {
  dirPath: string;
}): Promise<Model[]> {
  const { dirPath } = payload;

  if (!fs.existsSync(dirPath)) {
    console.log("Directory does not exist");
    return [];
  }

  const models: Model[] = [];

  // List contents of the directory to debug
  const contents = fs.readdirSync(dirPath);
  // First try to handle as regular model directory
  if (contents.length > 0) {
    try {
      // Process each publisher/author directory
      for (const publisher of contents) {
        if (publisher.startsWith(".")) continue;

        const publisherPath = path.join(dirPath, publisher);
        if (!fs.statSync(publisherPath).isDirectory()) continue;

        // First check for GGUF files directly in the publisher directory
        const publisherFiles = fs.readdirSync(publisherPath);
        for (const file of publisherFiles) {
          if (file.endsWith(".gguf")) {
            const modelPath = path.join(publisherPath, file);
            const stats = fs.statSync(modelPath);

            // Remove the .gguf extension for the model name
            const modelName = file.replace(".gguf", "");

            models.push({
              name: `${publisher}/${modelName}`,
              type: "llama.cpp",
              model_location: modelPath,
              modified_at: stats.mtime.toISOString(),
              size: stats.size,
              digest: "",
            });
          }
        }

        // Then check subdirectories for other model types
        for (const item of publisherFiles) {
          if (item.startsWith(".")) continue;

          const itemPath = path.join(publisherPath, item);
          if (!fs.statSync(itemPath).isDirectory()) continue;

          const stats = fs.statSync(itemPath);

          // Check for common model files to determine type
          const files = fs.readdirSync(itemPath);
          let modelType = "unknown";

          if (files.some((f) => f.endsWith(".gguf"))) {
            modelType = "llama.cpp";
          } else if (
            files.some((f) => f === "config.json" || f === "pytorch_model.bin")
          ) {
            modelType = "Transformers";
          }
          if (modelType !== "unknown") {
            if (item === "granite-embedding") continue;
            models.push({
              name: `${publisher}/${item}`,
              type: modelType,
              model_location: itemPath,
              modified_at: stats.mtime.toISOString(),
              size: stats.size,
              digest: "",
            });
          }
        }
      }
    } catch (err) {
      console.error("Error reading regular model directory:", err);
    }
  }

  // Then check for Ollama models in manifests directory
  const manifestsDir = path.join(dirPath, "manifests");

  if (fs.existsSync(manifestsDir)) {
    try {
      // Check registry.ollama.ai/library for official models
      const registryPath = path.join(
        manifestsDir,
        "registry.ollama.ai",
        "library"
      );
      if (fs.existsSync(registryPath)) {
        const entries = fs.readdirSync(registryPath, { withFileTypes: true });

        for (const entry of entries) {
          if (
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            !entry.name.includes("embedding")
          ) {
            const modelPath = path.join(registryPath, entry.name);
            const stats = fs.statSync(modelPath);

            models.push({
              name: entry.name,
              type: "ollama",
              model_location: modelPath,
              modified_at: stats.mtime.toISOString(),
              size: stats.size,
              digest: "",
            });
          }
        }
      }

      // Check hf.co for HuggingFace models
      const hfPath = path.join(manifestsDir, "hf.co");
      if (fs.existsSync(hfPath)) {
        const processHFDir = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith(".")) {
              const subEntries = fs.readdirSync(path.join(dir, entry.name), {
                withFileTypes: true,
              });
              for (const subEntry of subEntries) {
                if (subEntry.isDirectory() && !subEntry.name.startsWith(".")) {
                  const modelPath = path.join(dir, entry.name, subEntry.name);
                  const stats = fs.statSync(modelPath);

                  const ollamaModelName = `${entry.name}/${subEntry.name}`;

                  models.push({
                    name: ollamaModelName,
                    type: "ollama",
                    model_location: path.join(
                      manifestsDir,
                      "hf.co",
                      entry.name,
                      subEntry.name
                    ),
                    modified_at: stats.mtime.toISOString(),
                    size: stats.size,
                    digest: "",
                  });
                }
              }
            }
          }
        };
        processHFDir(hfPath);
      }
    } catch (err) {
      console.error("Error reading Ollama models directory:", err);
    }
  } else {
    console.log("No manifests directory found");
  }

  return models;
}
