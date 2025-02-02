import { platform } from "os";

export const getOllamaPath = () =>
  platform() === "darwin" ? "/usr/local/bin/ollama" : "ollama";
