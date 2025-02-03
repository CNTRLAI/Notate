"use server";

import path from "path";

export async function getCollectionPath(filepath: string) {
  const fullPath = path.join(process.cwd(), "FileCollections", filepath);
  const collectionPath = path.dirname(fullPath);
  return { path: collectionPath };
}

// Client-side helper (to be used in a client component)
// export function openCollectionInBrowser(filepath: string) {
//   window.open(`/api/files/${encodeURIComponent(filepath)}`, '_blank');
// }
