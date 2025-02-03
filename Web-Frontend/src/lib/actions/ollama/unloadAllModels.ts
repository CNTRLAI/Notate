import { getRunningModels } from "./getRunningModels";
import { unloadModel } from "./unloadModel";

export async function unloadAllModels(): Promise<void> {
  try {
    const runningModels = await getRunningModels();
    console.log("Currently running models:", runningModels);

    for (const model of runningModels) {
      try {
        await unloadModel(model);
      } catch (error) {
        console.log(`Error unloading model ${model}:`, error);
      }
    }
  } catch (error) {
    console.error("Error unloading all models:", error);
  }
}
