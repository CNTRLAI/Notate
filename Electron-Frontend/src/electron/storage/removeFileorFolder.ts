import fs from "fs";
import path from "path";
import { app } from "electron";

export function removeFileorFolder(payload: {
  userId: number;
  userName: string;
  file: string;
}): Promise<{
  userId: number;
  userName: string;
  file: string;
  success: boolean;
}> {
  try {
    const userPath = path.join(
      process.platform === "linux" ? app.getPath("userData") : app.getAppPath(),
      "..",
      "FileCollections",
      payload.userId.toString() + "_" + payload.userName
    );

    // Remove the user identifier prefix from the file path if it exists
    const filePath = payload.file.replace(
      new RegExp(`^${payload.userId}_${payload.userName}/`),
      ""
    );

    const fullPath = path.join(userPath, filePath);
    const normalizedFullPath = path.normalize(fullPath);
    const normalizedUserPath = path.normalize(userPath);

    // Security check: ensure the target path is within the user's directory
    if (!normalizedFullPath.startsWith(normalizedUserPath)) {
      throw new Error("Invalid file path");
    }

    if (!fs.existsSync(fullPath)) {
      return Promise.resolve({ ...payload, success: false });
    }

    fs.rmSync(fullPath, { recursive: true, force: true });

    // Verify the file/folder was actually removed
    if (fs.existsSync(fullPath)) {
      throw new Error("Failed to remove file or folder");
    }

    return Promise.resolve({ ...payload, success: true });
  } catch (error) {
    console.error("Error removing file or folder:", error);
    return Promise.resolve({ ...payload, success: false });
  }
}
