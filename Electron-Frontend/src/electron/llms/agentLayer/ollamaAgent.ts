import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { sendMessageChunk } from "../llmHelpers/sendMessageChunk.js";
import { BrowserWindow } from "electron";
import { zodToJsonSchema } from "zod-to-json-schema";
import ollama from "ollama";
import { z } from "zod";
import { webSearch } from "./tools/websearch.js";

export async function ollamaAgent(
  messages: ChatCompletionMessageParam[],
  userSettings: UserSettings,
  mainWindow: BrowserWindow | null = null
): Promise<{
  content: string;
  webSearchResult: WebSearchResult | null;
}> {
  console.log("ollamaAgent");
  sendMessageChunk("[Agent]: ", mainWindow);
  const sysPrompt: ChatCompletionMessageParam = {
    role: "system",
    content: `You are an AI Agent with the ability to visit websites and extract text and metadata.
    Your task is to analyze if the user is DIRECTLY requesting to visit or check a specific website.
    
    ONLY use web search or news search if the user explicitly asks to visit, check, or get information from a specific URL or website or websearch or news search.
    Do not infer or assume web search would be helpful unless directly requested asking what is on a website is a valid web search. 
    
    If the user directly requests web search, respond with EXACTLY this JSON format:
    {
      "webUrl": 1,
      "url": "full_url_here"
    }
    
    For all other queries, even if web search might be helpful, respond with EXACTLY:
    {
      "webUrl": 0,
      "url": ""
    }
    
    example:
    user: "What is on the google news page?"
    agent: {
      "webUrl": 1,
      "url": "https://news.google.com"
    }
    

    user: "What is the capital of France?"
    agent: {
      "webUrl": 0,
      "url": ""
    }

    Only respond with one of these two JSON formats, nothing else.
    Make sure the URL is a complete, valid URL starting with http:// or https://
    Do not include any explanation or additional text in your response.`,
  };

  const AgentActions = z.object({
    webUrl: z.number(),
    url: z.string(),
  });

  type OllamaMessage = { role: string; content: string };
  const convertToOllamaMessages = (
    msgs: ChatCompletionMessageParam[]
  ): OllamaMessage[] =>
    msgs.map((msg) => ({
      role: msg.role,
      content: msg.content
        ? typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content) &&
            msg.content[0] &&
            "text" in msg.content[0]
          ? msg.content[0].text
          : ""
        : "",
    }));

  const response = await ollama.chat({
    model: userSettings.model || "llama2",
    messages: convertToOllamaMessages([sysPrompt, ...messages]),
    format: zodToJsonSchema(AgentActions),
  });

  const agentActions = AgentActions.parse(JSON.parse(response.message.content));

  let webSearchResult;
  if (agentActions.webUrl === 1) {
    webSearchResult = (await webSearch({
      url: agentActions.url,
    })) as WebSearchResult;
  }
  console.log("agentActions", agentActions);
  sendMessageChunk(
    "[REASONING]: " + "Visiting website: " + agentActions.url,
    mainWindow
  );
  console.log("webSearchResult", webSearchResult);
  sendMessageChunk("[Agent]: " + JSON.stringify(webSearchResult), mainWindow);
  return {
    content: "Visiting website: " + agentActions.url,
    webSearchResult: webSearchResult || null,
  };
}
