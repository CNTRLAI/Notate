import OpenAI, { AzureOpenAI } from "openai";
import db from "@/src/lib/db";
import { getToken } from "@/src/lib/authentication/token";
import { User } from "@/src/types/user";

export async function providerInitialize(
  providerName: string,
  activeUser: User
): Promise<OpenAI | AzureOpenAI> {
  if (providerName === "openrouter") {
    console.log("Initializing OpenRouter");
    return initializeOpenRouter(activeUser);
  }
  if (providerName === "azure open ai") {
    console.log("Initializing Azure OpenAI");
    return initializeAzureOpenAI(activeUser);
  }
  if (providerName === "deepseek") {
    console.log("Initializing DeepSeek");
    return initializeDeepSeek(activeUser);
  }
  if (providerName === "xai") {
    console.log("Initializing XAI");
    return initializeXAI(activeUser);
  }
  if (providerName === "custom") {
    console.log("Initializing Custom");
    return initializeCustom(activeUser);
  }
  if (providerName === "local") {
    console.log("Initializing Local OpenAI");
    return initializeLocalOpenAI(activeUser);
  }
  console.log("Initializing OpenAI");
  const apiKey = await db.api_keys.findFirst({
    where: {
      user_id: activeUser.id,
      provider: providerName,
    },
  });
  const provider = new OpenAI({ apiKey: apiKey?.key });

  if (!provider) {
    throw new Error(`${providerName} instance not initialized`);
  }
  return provider;
}

async function initializeOpenRouter(activeUser: User) {
  const apiKey = await db.api_keys.findFirst({
    where: {
      user_id: activeUser.id,
      provider: "openrouter",
    },
  });
  const openai = new OpenAI({
    apiKey: apiKey?.key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://notate.hairetsu.com",
      "X-Title": "Notate",
    },
  });
  return openai;
}

async function initializeAzureOpenAI(activeUser: User) {
  const userSettings = await db.settings.findFirst({
    where: {
      user_id: activeUser.id,
    },
  });
  if (!userSettings) {
    throw new Error("User settings not found for the active user");
  }
  if (!userSettings.selectedAzureId) {
    throw new Error("Azure OpenAI model not found for the active user");
  }
  const azureModel = await db.azure_openai_models.findFirst({
    where: {
      id: Number(userSettings.selectedAzureId),
    },
  });
  if (!azureModel) {
    throw new Error("Azure OpenAI model not found for the active user");
  }
  const openai = new AzureOpenAI({
    baseURL: azureModel.endpoint,
    apiKey: azureModel.api_key,
    deployment: azureModel.model,
    apiVersion: "2024-05-01-preview",
  });
  return openai;
}

async function initializeDeepSeek(activeUser: User) {
  const apiKey = await db.api_keys.findFirst({
    where: {
      user_id: activeUser.id,
      provider: "deepseek",
    },
  });
  if (!apiKey) {
    throw new Error("DeepSeek API key not found");
  }
  const openai = new OpenAI({
    apiKey: apiKey.key,
    baseURL: "https://api.deepseek.com",
    defaultHeaders: {
      "HTTP-Referer": "https://notate.hairetsu.com",
      "X-Title": "Notate",
    },
  });
  return openai;
}

async function initializeCustom(activeUser: User) {
  let customAPIs;
  const userSettings = await db.settings.findFirst({
    where: {
      user_id: activeUser.id,
    },
  });
  if (!userSettings) {
    throw new Error("User settings not found for the active user");
  }
  if (userSettings.provider == "custom") {
    customAPIs = await db.custom_api.findMany({
      where: {
        user_id: activeUser.id,
      },
    });
    if (customAPIs.length == 0 || !userSettings.selectedCustomId) {
      throw new Error("No custom API selected");
    }
    const customAPI = customAPIs.find(
      (api) => api.id == userSettings.selectedCustomId
    );
    if (!customAPI) {
      throw new Error("Custom API not found");
    }
    const apiKey = await db.api_keys.findFirst({
      where: {
        user_id: activeUser.id,
        provider: "custom",
      },
    });
    if (!apiKey) {
      throw new Error("Custom API key not found");
    }
    const openai = new OpenAI({
      apiKey: apiKey.key,
      baseURL: customAPI.endpoint,
    });
    return openai;
  }
  throw new Error("Custom API not found");
}

async function initializeLocalOpenAI(activeUser: User) {
  const apiKey = await getToken({ userId: activeUser.id.toString() });
  const openai = new OpenAI({
    baseURL: "http://127.0.0.1:47372",
    apiKey: apiKey,
  });
  return openai;
}

async function initializeXAI(activeUser: User) {
  const apiKey = await db.api_keys.findFirst({
    where: {
      user_id: activeUser.id,
      provider: "xai",
    },
  });
  const openai = new OpenAI({
    apiKey: apiKey?.key,
    baseURL: "https://api.x.ai/v1",
  });
  return openai;
}
