"use server";

import db from "@/src/lib/db";
import { DevApiKey } from "@/src/types/apiKeys";

export const getDevApiKeys = async () => {
  const devApiKeys = await db.dev_api_key.findMany();
  return devApiKeys;
};

export const createDevApiKey = async (
  devApiKey: DevApiKey,
  user_id: number
) => {
  const newDevApiKey = await db.dev_api_key.create({
    data: {
      ...devApiKey,
      user_id: user_id,
    },
  });
  return newDevApiKey;
};

export const deleteDevApiKey = async (id: number) => {
  const deletedDevApiKey = await db.dev_api_key.delete({
    where: { id },
  });
  return deletedDevApiKey;
};
