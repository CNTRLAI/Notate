import { OpenAI } from "openai";
import { webSearch } from "./tools/websearch.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { sendMessageChunk } from "../llmHelpers/sendMessageChunk.js";
import { BrowserWindow } from "electron";

export async function openAiAgent(
  provider: OpenAI,
  messages: ChatCompletionMessageParam[],
  maxOutputTokens: number,
  userSettings: UserSettings,
  signal?: AbortSignal,
  mainWindow: BrowserWindow | null = null
): Promise<{
  content: string;
  webSearchResult: WebSearchResult | null;
}> {
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

  const response = await provider.chat.completions.create(
    {
      model: userSettings.model as string,
      messages: [sysPrompt, ...messages],
      temperature: 0.1,
      max_tokens: maxOutputTokens,
      response_format: { type: "json_object" },
    },
    { signal }
  );

  const content = response.choices[0]?.message?.content || "{}";

  const contentObj = JSON.parse(content) as { webUrl: number; url: string };

  let webSearchResult: {
    metadata: {
      title: string;
      source: string;
      description: string;
      author: string;
      keywords: string;
      ogImage: string;
    };
    textContent: string;
  } | null = null;

  if (contentObj.webUrl === 1) {
    webSearchResult = (await webSearch({
      url: contentObj.url,
    })) as WebSearchResult;
  }
  sendMessageChunk("[REASONING]: " + content, mainWindow);
  sendMessageChunk("[Agent]: " + JSON.stringify(webSearchResult), mainWindow);
  return { content, webSearchResult };
}
