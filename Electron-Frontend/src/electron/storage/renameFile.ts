import fs from "fs";
import path from "path";
import { app } from "electron";

export function renameFile(payload: {
  userId: number;
  userName: string;
  file: string;
  newName: string;
}): Promise<{
  userId: number;
  userName: string;
  file: string;
  newName: string;
  success: boolean;
}> {
  try {
    console.log("Rename file payload:", payload);

    const userPath = path.join(
      process.platform === "linux" ? app.getPath("userData") : app.getAppPath(),
      "..",
      "FileCollections",
      payload.userId.toString() + "_" + payload.userName
    );
    console.log("User path:", userPath);

    // Remove the user identifier prefix from the file path if it exists
    const filePath = payload.file.replace(
      new RegExp(`^${payload.userId}_${payload.userName}/`),
      ""
    );

    // The file path should already include the collection directory
    const oldPath = path.join(userPath, filePath);
    const newPath = path.join(path.dirname(oldPath), payload.newName);

    console.log("Old path:", oldPath);
    console.log("New path:", newPath);

    // Security check: ensure both paths are within the user's directory
    const normalizedOldPath = path.normalize(oldPath);
    const normalizedNewPath = path.normalize(newPath);
    const normalizedUserPath = path.normalize(userPath);

    if (
      !normalizedOldPath.startsWith(normalizedUserPath) ||
      !normalizedNewPath.startsWith(normalizedUserPath)
    ) {
      console.error("Invalid file path - security check failed");
      return Promise.resolve({ ...payload, success: false });
    }

    // Check if source exists and destination doesn't
    if (!fs.existsSync(oldPath)) {
      console.error("Source file does not exist:", oldPath);
      return Promise.resolve({ ...payload, success: false });
    }

    if (fs.existsSync(newPath)) {
      console.error("Destination already exists:", newPath);
      return Promise.resolve({ ...payload, success: false });
    }

    // Create the directory if it doesn't exist
    const newDir = path.dirname(newPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }

    // Perform the rename
    fs.renameSync(oldPath, newPath);

    // Verify the rename was successful
    if (!fs.existsSync(newPath)) {
      console.error("Rename operation failed - new file does not exist");
      return Promise.resolve({ ...payload, success: false });
    }

    return Promise.resolve({ ...payload, success: true });
  } catch (error) {
    console.error("Error renaming file:", error);
    return Promise.resolve({ ...payload, success: false });
  }
}
