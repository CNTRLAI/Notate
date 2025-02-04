"use server";
import db from "@/src/lib/db";

export const getCollections = async (user_id: number) => {
  const collections = await db.collections.findMany({
    where: { user_id },
  });
  return collections;
};

export const createCollection = async (
  user_id: string,
  is_local: boolean,
  local_embedding_model: string,
  name: string,
  description: string,
  type: string
) => {
  const newCollection = await db.collections.create({
    data: {
      user_id: parseInt(user_id),
      is_local: is_local ? 1 : 0,
      local_embedding_model: local_embedding_model,
      name: name,
      description: description,
      type: type,
      files: "",
    },
  });
  return {
    ...newCollection,
    userId: newCollection.user_id,
  };
};

export const getFilesInCollection = async (collection_id: number) => {
  const files = await db.collections.findUnique({
    where: { id: collection_id },
  });
  return files?.files;
};

export const deleteCollection = async (collection_id: number) => {
  await db.collections.delete({ where: { id: collection_id } });
};

export const getCollection = async (collection_id: number) => {
  const collection = await db.collections.findUnique({
    where: { id: collection_id },
  });
  return collection;
};
