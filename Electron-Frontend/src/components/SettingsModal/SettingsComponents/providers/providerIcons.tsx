import openai from "@/assets/providers/openai.svg";
import anthropic from "@/assets/providers/anthropic.svg";
import gemini from "@/assets/providers/gemini.svg";
import xai from "@/assets/providers/xai.svg";
import openrouter from "@/assets/providers/openrouter.svg";
import ollama from "@/assets/providers/ollama.svg";
import azure from "@/assets/providers/azure.svg";
import custom from "@/assets/providers/network.svg";
import deepseek from "@/assets/providers/deepseek.svg";
import { HouseIcon } from "lucide-react";
import { ReactNode } from "react";
import { SvgIcon } from "./SvgIcon";

export const providerIcons: Record<string, ReactNode> = {
  openai: <SvgIcon src={openai} alt="OpenAI" />,
  anthropic: <SvgIcon src={anthropic} alt="Anthropic" />,
  gemini: <SvgIcon src={gemini} alt="Gemini" />,
  xai: <SvgIcon src={xai} alt="XAI" />,
  local: <HouseIcon className="h-3 w-3" />,
  openrouter: <SvgIcon src={openrouter} alt="OpenRouter" />,
  ollama: <SvgIcon src={ollama} alt="Ollama" />,
  "azure open ai": <SvgIcon src={azure} alt="Azure" />,
  deepseek: <SvgIcon src={deepseek} alt="DeepSeek" />,
  custom: <SvgIcon src={custom} alt="Custom" />,
};
