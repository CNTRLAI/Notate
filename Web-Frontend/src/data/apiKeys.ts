"use server";

import db from "@/src/lib/db";
import { ApiKey, DevApiKey } from "../types/apiKeys";

export const getApiKeys = async (userId: number) => {
  const apiKeys = await db.api_keys.findMany({
    where: {
      user_id: userId,
    },
  });
  return apiKeys;
};

export const getApiKey = async (userId: number, provider: string) => {
  const apiKey = await db.api_keys.findFirst({
    where: {
      user_id: userId,
      provider: provider,
    },
  });
  return apiKey;
};

export const createApiKey = async (apiKey: ApiKey, user_id: number) => {
  const newApiKey = await db.api_keys.create({
    data: {
      key: apiKey.key,
      provider: apiKey.provider,
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

export const deleteDevAPIKey = async (user_id: number, id: number) => {
  const deletedDevAPIKey = await db.dev_api_keys.delete({
    where: { id, user_id },
  });
  return deletedDevAPIKey;
};

export const createDevAPIKey = async (
  devAPIKey: DevApiKey,
  user_id: number,
  expiration: string | null
) => {
  const newDevAPIKey = await db.dev_api_keys.create({
    data: {
      ...devAPIKey,
      user_id: user_id,
      expiration: expiration,
    },
  });
  return newDevAPIKey;
};

export const getDevAPIKeys = async (user_id: number) => {
  const devAPIKeys = await db.dev_api_keys.findMany({
    where: { user_id },
  });
  return devAPIKeys;
};
