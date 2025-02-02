import { ipcMainDatabaseHandle } from "../util.js";
import { openCollectionFolderFromFileExplorer } from "../storage/openCollectionFolder.js";
import { getUserCollectionFiles } from "../storage/getUserFiles.js";
import { removeFileorFolder } from "../storage/removeFileorFolder.js";
import { renameFile } from "../storage/renameFile.js";

export function setupFileHandlers() {
  ipcMainDatabaseHandle("getUserCollectionFiles", async (payload) => {
    const result = await getUserCollectionFiles(payload);
    return result;
  });

  ipcMainDatabaseHandle(
    "openCollectionFolderFromFileExplorer",
    async (payload) => {
      const result = await openCollectionFolderFromFileExplorer(
        payload.filepath
      );
      return result;
    }
  );

  ipcMainDatabaseHandle("removeFileorFolder", async (payload) => {
    const result = await removeFileorFolder(payload);
    return result;
  });

  ipcMainDatabaseHandle("renameFile", async (payload) => {
    const result = await renameFile(payload);
    return result;
  });
}
