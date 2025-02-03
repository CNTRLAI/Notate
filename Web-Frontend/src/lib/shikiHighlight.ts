import { createHighlighter, Highlighter } from "shiki";

let highlighter: Highlighter | null = null;
export async function initializeShiki() {
  highlighter = await createHighlighter({
    themes: ["github-dark-dimmed"],
    langs: [
      "javascript",
      "typescript",
      "python",
      "html",
      "css",
      "json",
      "bash",
      "java",
      "c",
      "cpp",
      "csharp",
      "go",
      "rust",
      "ruby",
      "php",
      "swift",
      "kotlin",
      "sql",
      "yaml",
      "xml",
      "markdown",
      "shell",
      "dockerfile",
      "json",
      "yaml",
      "xml",
      "markdown",
      "shell",
      "dockerfile",
      "powershell",
      "sql",
      "yaml",
      "json",
      "markdown",
      "shell",
      "dockerfile",
    ],
  });
}

export function highlightCode(code: string, language: string): string {
  if (language === "math") {
    language = "python";
  }
  if (!highlighter) {
    console.error("Shiki highlighter not initialized");
    return code;
  }
  try {
    // Use plaintext as fallback for unsupported languages
    const lang = language.toLowerCase();
    return highlighter.codeToHtml(code, {
      lang: highlighter.getLoadedLanguages().includes(lang)
        ? lang
        : "plaintext",
      theme: "github-dark-dimmed",
    });
  } catch (error) {
    console.error("Error highlighting code:", error);
    return code;
  }
}
