import Anthropic from "@anthropic-ai/sdk";
import db from "../db.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { providerInitialize } from "./llmHelpers/providerInit.js";

async function chatCompletionTitle(
  input: string,
  user: User,
  provider: string,
  model: string
) {
  const openai = await providerInitialize(provider, user);
  const llmTitleRequest = await openai.chat.completions.create({
    model: model,
    messages: titleMessages(input),
    max_tokens: 20,
  });
  return llmTitleRequest.choices[0]?.message?.content?.trim();
}

const titleMessages = (input: string): ChatCompletionMessageParam[] => [
  {
    role: "system" as const,
    content:
      "Generate a short, concise title (5 words or less) for a conversation based on the following message: Return the Title only and nothing else example response: 'Meeting with John' Return: 'Meeting with John'",
  },
  { role: "user" as const, content: input },
];

async function generateTitleOpenRouter(input: string, user: User) {
  return chatCompletionTitle(input, user, "openrouter", "openai/gpt-3.5-turbo");
}

async function generateTitleDeepSeek(input: string, user: User) {
  return chatCompletionTitle(input, user, "deepseek", "deepseek-chat");
}

async function generateTitleCustom(
  input: string,
  user: User,
  userSettings: UserSettings
) {
  if (!userSettings.selectedCustomId) {
    throw new Error("Custom API not found");
  }
  const openai = await providerInitialize("custom", user);
  const stream = await openai.chat.completions.create({
    model: userSettings.model || "",
    messages: titleMessages(input),
    stream: true,
    temperature: 0.7,
    max_tokens: 20,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  });
  let generatedTitle = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    generatedTitle += content;
  }
  return generatedTitle;
}

async function generateTitleAnthropic(input: string, user: User) {
  let apiKey = "";
  try {
    apiKey = db.getApiKey(user.id, "anthropic");
  } catch (error) {
    console.error("Error getting API key:", error);
  }
  if (!apiKey) {
    throw new Error("Anthropic API key not found for the active user");
  }
  const anthropic = new Anthropic({ apiKey });
  const llmTitleRequest = (await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 20,
    system:
      "Generate a short, concise title (5 words or less) for a conversation based on the following message: Return the Title only and nothing else example response: 'Meeting with John' Return: 'Meeting with John'",
    messages: [
      {
        role: "user",
        content: input,
      },
    ],
  })) as unknown as {
    content: { text: string }[];
  };

  const generatedTitle = llmTitleRequest.content[0].text;
  return generatedTitle || "New Conversation";
}

async function generateTitleGemini(input: string, user: User) {
  let apiKey = "";
  try {
    apiKey = db.getApiKey(user.id, "gemini");
  } catch (error) {
    console.error("Error getting API key:", error);
  }
  if (!apiKey) {
    throw new Error("Gemini API key not found for the active user");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const titleResult = await model.generateContent(
    "Generate a short, concise title (5 words or less) for a conversation based on the following message: Return the Title only and nothing else example response: 'Meeting with John' Return: 'Meeting with John'\n\n" +
      input
  );
  const generatedTitle = titleResult.response.text().trim();

  return generatedTitle ?? "New Conversation";
}

async function generateTitleXAI(input: string, user: User) {
  return chatCompletionTitle(input, user, "xai", "grok-beta");
}

async function generateOllamaTitle(input: string, model: string) {
  try {
    const messages = titleMessages(input);
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false, // Disable streaming to get a single response
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    // Ollama returns one JSON object per line
    const lines = text.split("\n").filter((line) => line.trim());
    const lastLine = lines[lines.length - 1];
    const lastResponse = JSON.parse(lastLine);
    if (!lastResponse.message?.content) {
      console.warn("Empty response from Ollama:", lastResponse);
      return "New Conversation";
    }

    return lastResponse.message.content.trim() || "New Conversation";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Conversation";
  }
}

async function generateTitleOpenAI(input: string, user: User) {
  return chatCompletionTitle(input, user, "openai", "gpt-4o");
}

async function generateTitleAzureOpenAI(input: string, user: User) {
  return chatCompletionTitle(input, user, "azure open ai", "gpt-4o");
}

async function generateTitleLocalOpenAI(
  input: string,
  user: User,
  userSettings: UserSettings
) {
  const openai = await providerInitialize("local", user);
  const stream = await openai.chat.completions.create({
    model: userSettings.model || "",
    messages: titleMessages(input),
    stream: true,
    temperature: 0.7,
    max_tokens: 20,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  });
  let generatedTitle = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    generatedTitle += content;
  }
  return generatedTitle;
}

export async function generateTitle(input: string, user: User) {
  const userSettings = await db.getUserSettings(user.id);
  switch (userSettings.provider?.toLowerCase()) {
    case "openai":
      return generateTitleOpenAI(input, user);
    case "openrouter":
      return generateTitleOpenRouter(input, user);
    case "azure open ai":
      return generateTitleAzureOpenAI(input, user);
    case "anthropic":
      return generateTitleAnthropic(input, user);
    case "gemini":
      return generateTitleGemini(input, user);
    case "xai":
      return generateTitleXAI(input, user);
    case "local":
      return generateTitleLocalOpenAI(input, user, userSettings);
    case "ollama":
      return generateOllamaTitle(input, userSettings.model || "llama3.2");
    case "custom":
      return generateTitleCustom(input, user, userSettings);
    case "deepseek":
      return generateTitleDeepSeek(input, user);
    default:
      return "New Conversation";
  }
}
