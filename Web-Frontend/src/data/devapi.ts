"use server";

import db from "@/src/lib/db";
import { DevApiKey } from "@/src/types/apiKeys";

export const getDevApiKeys = async (userId: number) => {
  const devApiKeys = await db.dev_api_keys.findMany({
    where: {
      user_id: userId,
    },
  });
  return devApiKeys;
};

export const createDevApiKey = async (
  devApiKey: DevApiKey,
  user_id: number
) => {
  const newDevApiKey = await db.dev_api_keys.create({
    data: {
      ...devApiKey,
      user_id: user_id,
    },
  });
  return newDevApiKey;
};

export const deleteDevApiKey = async (id: number) => {
  const deletedDevApiKey = await db.dev_api_keys.delete({
    where: { id },
  });
  return deletedDevApiKey;
};
