"use server";

import db from "@/src/lib/db";
import { ApiKey } from "../types/apiKeys";

export const getApiKeys = async () => {
  const apiKeys = await db.api_keys.findMany();
  return apiKeys;
};

export const createApiKey = async (apiKey: ApiKey, user_id: number) => {
  const newApiKey = await db.api_keys.create({
    data: {
      ...apiKey,
      user_id: user_id,
    },
  });
  return newApiKey;
};

export const deleteApiKey = async (id: number) => {
  const deletedApiKey = await db.api_keys.delete({
    where: { id },
  });
  return deletedApiKey;
};

export const updateApiKey = async (apiKey: ApiKey, user_id: number) => {
  const updatedApiKey = await db.api_keys.update({
    where: { id: apiKey.id },
    data: {
      ...apiKey,
      user_id: user_id,
    },
  });
  return updatedApiKey;
};
