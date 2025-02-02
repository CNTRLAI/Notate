import { shell, app } from "electron";
import path from "path";

export const openCollectionFolder = (filepath: string) => {
  const collectionPath = path.dirname(filepath);
  shell.openPath(collectionPath);
};

export const openCollectionFolderFromFileExplorer = (filepath: string) => {
  console.log("Opening collection folder:", filepath);
  const basePath =
    process.platform === "linux" ? app.getPath("userData") : app.getAppPath();
  const fullPath = path.join(basePath, "..", "FileCollections", filepath);
  const collectionPath = path.dirname(fullPath);
  console.log("Collection path:", collectionPath);
  shell.openPath(collectionPath);
  return { filepath };
};
