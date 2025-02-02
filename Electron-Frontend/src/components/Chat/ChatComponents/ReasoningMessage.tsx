import { BrainCircuit, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState, CSSProperties, useEffect, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

// Lazy load the syntax highlighter
const SyntaxHighlightedCode = lazy(() =>
  import("@/components/Chat/ChatComponents/SyntaxHightlightedCode").then(
    (module) => ({ default: module.SyntaxHighlightedCode })
  )
);

interface ReasoningMessageProps {
  content: string;
}

export const ReasoningMessage = ({ content }: ReasoningMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [renderedContent, setRenderedContent] = useState<(string | JSX.Element)[]>([]);

  const renderContent = async (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index).trim();
        if (textContent) {
          const result = await unified()
            .use(remarkParse)
            .use(remarkFrontmatter)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(() => (tree: Root) => {
              // Transform links to open in new window
              visit(tree, "element", (node: Element) => {
                if (node.tagName === "a" && node.properties?.href) {
                  node.properties.onclick = `(function(e){e.preventDefault();window.electron.openExternal("${node.properties.href}")})`;
                  node.properties.href = "#";
                }
              });
              return tree;
            })
            .use(rehypeStringify)
            .process(textContent);
          parts.push(
            <div
              key={`text-${lastIndex}`}
              className="contentMarkdown"
              dangerouslySetInnerHTML={{ __html: result }}
            />
          );
        }
      }

      const language = match[1] || "text";
      const code = match[2].trim();
      parts.push(
        <div
          key={`code-${match.index}`}
          className="w-full overflow-x-auto my-2"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <SyntaxHighlightedCode code={code} language={language} />
          </Suspense>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const textContent = content.slice(lastIndex).trim();
      if (textContent) {
        const result = await unified()
          .use(remarkParse)
          .use(remarkFrontmatter)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(() => (tree: Root) => {
            // Transform links to open in new window
            visit(tree, "element", (node: Element) => {
              if (node.tagName === "a" && node.properties?.href) {
                node.properties.onclick = `(function(e){e.preventDefault();window.electron.openExternal("${node.properties.href}")})`;
                node.properties.href = "#";
              }
            });
            return tree;
          })
          .use(rehypeStringify)
          .process(textContent);

        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="contentMarkdown"
            dangerouslySetInnerHTML={{ __html: String(result) }}
          />
        );
      }
    }

    return parts;
  };

  useEffect(() => {
    renderContent(content).then(setRenderedContent);
  }, [content]);

  return (
    <div className="flex flex-col gap-2 my-4 w-full justify-center items-center">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={
          {
            "--shimmer-color": "rgba(255, 255, 255, 0.3)",
            "--radius": "1.25rem",
            "--speed": "5s",
          } as CSSProperties
        }
        className={cn(
          "bg-secondary/30 group relative z-0 flex max-w-[80%] cursor-pointer items-center justify-between px-4 py-2.5 overflow-hidden",
          "backdrop-blur-sm border border-secondary/30",
          "transform-gpu transition-all duration-300",
          "hover:bg-secondary/40 hover:scale-[1.02]",
          "[border-radius:var(--radius)]",
          "shadow-[0_0_15px_rgba(0,0,0,0.1)]"
        )}
      >
        {/* Shimmer border */}
        <div className="absolute inset-0 -z-20">
          <div
            className="absolute inset-0 animate-border rounded-[1.25rem]"
            style={{
              background: `linear-gradient(90deg, transparent, var(--shimmer-color), transparent)`,
              backgroundSize: "200% 100%",
              maskImage: `linear-gradient(black, black), linear-gradient(black, black)`,
              maskSize: "100% 100%",
              maskPosition: "0 0, 100% 0",
              maskRepeat: "no-repeat",
              WebkitMaskComposite: "destination-out",
              maskComposite: "exclude",
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <BrainCircuit className="w-4 h-4 text-primary/70" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary/90">
              Chain of Thought
            </span>
            <Sparkles className="w-3.5 h-3.5 text-primary/50" />
          </div>
        </div>
        <div className="text-primary/60">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>

        {/* Background */}
        <div className="absolute -z-30 [background:var(--bg)] [border-radius:var(--radius)] inset-0" />
      </div>

      {isExpanded && (
        <div className="overflow-hidden rounded-xl border border-secondary/30 animate-in slide-in-from-top-2 duration-200 w-[80%] shadow-lg">
          <div className="px-4 py-2.5 border-b border-secondary/30 bg-secondary/20 backdrop-blur-sm">
            <div className="text-sm font-medium text-primary/80 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary/50" />
              Reasoning Process
            </div>
          </div>
          <div className="bg-secondary/10 backdrop-blur-sm">
            <div className="px-5 py-4 text-sm [overflow-wrap:anywhere] text-left overflow-hidden">
              {renderedContent}
              <div className="sr-only">{content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
