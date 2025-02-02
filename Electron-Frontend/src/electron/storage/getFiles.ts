import db from "../db.js";
export function getFilesInCollection(userId: number, collectionId: number) {
  try {
    const files = db.getFilesInCollection(userId, collectionId);
    return files;
  } catch (error) {
    console.error("Error reading files in collection:", error);
    return [];
  }
}
