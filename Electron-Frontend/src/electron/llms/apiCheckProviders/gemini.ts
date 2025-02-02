import { GoogleGenerativeAI } from "@google/generative-ai";
import log from "electron-log"; 
let genAI: GoogleGenerativeAI;
async function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function GeminiProviderAPIKeyCheck(apiKey: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (!apiKey) {
    log.error("Gemini API key not found for the active user");
    throw new Error("Gemini API key not found for the active user");
  }
  await initializeGemini(apiKey);

  if (!genAI) {
    log.error("Gemini instance not initialized");
    throw new Error("Gemini instance not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent("Hello, world!");
  const response = await result.response;
  log.info(`Response: ${JSON.stringify(response)}`);
  if (response.text()) {
    return {
      success: true,
    };
  }

  return {
    error: "Gemini API key is invalid",
  };
}
