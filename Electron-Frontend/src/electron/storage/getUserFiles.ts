import fs from "fs";
import path from "path";
import { app } from "electron";

export function getUserCollectionFiles(payload: {
  userId: number;
  userName: string;
}): Promise<{
  userId: number;
  userName: string;
  files: string[];
}> {
  const userPath = path.join(
    process.platform === "linux" ? app.getPath("userData") : app.getAppPath(),
    "..",
    "FileCollections",
    payload.userId.toString() + "_" + payload.userName
  );

  if (!fs.existsSync(userPath)) {
    return Promise.resolve({ ...payload, files: [] });
  }

  const getAllFiles = (dirPath: string): string[] => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  };

  const files = getAllFiles(userPath);
  const relativeFiles = files.map((file) => path.relative(userPath, file));

  return Promise.resolve({ ...payload, files: relativeFiles });
}
