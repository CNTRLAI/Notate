import db from "@/src/lib/db";

export function getFilesInCollection(userId: number, collectionId: number) {
  try {
    const files = db.collections.findMany({
      where: {
        user_id: userId,
        id: collectionId,
      },
    });
    return files;
  } catch (error) {
    console.error("Error reading files in collection:", error);
    return [];
  }
}
