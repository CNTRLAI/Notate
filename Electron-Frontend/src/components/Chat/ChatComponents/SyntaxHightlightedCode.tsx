import { highlightCode } from "@/lib/shikiHightlight";
import { useClipboard } from "use-clipboard-copy";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface SyntaxHighlightedCodeProps {
  code: string;
  language: string;
}

export function SyntaxHighlightedCode({
  code,
  language,
}: SyntaxHighlightedCodeProps) {
  const normalizedLanguage = normalizeLanguage(language, code);
  const highlightedCode = highlightCode(code, normalizedLanguage);
  const clipboard = useClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    clipboard.copy(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="rounded-[4px] overflow-hidden bg-[#22272e] relative max-w-full">
      <div className="absolute top-2 right-2">
        <button
          onClick={handleCopy}
          className="p-2 bg-gray-700 rounded-[4px] text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          aria-label="Copy code"
        >
          {isCopied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="break-words w-full">
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
              display: "block",
              fontSize: "0.9em",
              lineHeight: "1.5",
            }}
          />
        </pre>
      </div>
    </div>
  );
}

function normalizeLanguage(language: string, code: string): string {
  language = language.toLowerCase();
  if (
    language === "typescript" ||
    language === "ts" ||
    language === "tsx" ||
    language === "jsx"
  ) {
    return "typescript";
  }
  if (language === "javascript" || language === "js") {
    return "javascript";
  }
  if (!language && /^\s*\{[\s\S]*\}\s*$/.test(code)) {
    return "json";
  }
  return language || "plaintext";
}
