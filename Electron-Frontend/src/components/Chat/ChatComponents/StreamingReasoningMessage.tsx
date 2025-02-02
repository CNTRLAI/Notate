import { BrainCircuit, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState, CSSProperties, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/useUser";
import { SyntaxHighlightedCode } from "@/components/Chat/ChatComponents/SyntaxHightlightedCode";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { Button } from "@/components/ui/button";

export const StreamingReasoningMessage = () => {
  const { streamingMessageReasoning, agentActions } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [agentActionsExpanded, setAgentActionsExpanded] = useState(false);
  const [parsedContent, setParsedContent] = useState<(string | JSX.Element)[]>(
    []
  );

  useEffect(() => {
    const renderContent = async () => {
      const parts: (string | JSX.Element)[] = [];
      let codeBlock = "";
      let isInCodeBlock = false;
      let language = "";

      const lines = streamingMessageReasoning?.split("\n") || [];
      let textContent = "";

      for (const line of lines) {
        if (line.startsWith("```")) {
          if (isInCodeBlock) {
            // End of code block - render the code
            parts.push(
              <SyntaxHighlightedCode
                key={parts.length}
                code={codeBlock.trim()}
                language={language}
              />
            );
            codeBlock = "";
            isInCodeBlock = false;
            language = "";
          } else {
            // Start of code block - render accumulated text content
            if (textContent.trim()) {
              const result = await unified()
                .use(remarkParse)
                .use(remarkFrontmatter)
                .use(remarkGfm)
                .use(remarkRehype)
                .use(rehypeStringify)
                .process(textContent.trim());

              parts.push(
                <div
                  key={parts.length}
                  className="contentMarkdown"
                  dangerouslySetInnerHTML={{ __html: String(result) }}
                />
              );
              textContent = "";
            }
            isInCodeBlock = true;
            language = line.slice(3).trim() || "text";
          }
        } else if (isInCodeBlock) {
          codeBlock += line + "\n";
        } else {
          textContent += line + "\n";
        }
      }

      // Handle any remaining content
      if (isInCodeBlock) {
        parts.push(
          <SyntaxHighlightedCode
            key={parts.length}
            code={codeBlock.trim()}
            language={language}
          />
        );
      } else if (textContent.trim()) {
        const result = await unified()
          .use(remarkParse)
          .use(remarkFrontmatter)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process(textContent.trim());

        parts.push(
          <div
            key={parts.length}
            className="contentMarkdown"
            dangerouslySetInnerHTML={{ __html: String(result) }}
          />
        );
      }

      setParsedContent(parts);
    };

    renderContent();
  }, [streamingMessageReasoning]);

  return (
    <div className="flex flex-col gap-2 my-4 w-full justify-center items-center">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={
          {
            "--shimmer-color": "rgba(255, 255, 255, 0.3)",
            "--radius": "1rem",
            "--speed": "5s",
          } as CSSProperties
        }
        className={cn(
          " bg-secondary/30 group relative z-0 flex max-w-[80%] cursor-pointer items-center justify-between px-3 py-2 overflow-hidden",
          "backdrop-blur-sm border border-secondary/30",
          "transform-gpu transition-all duration-300",
          "hover:bg-secondary/30",
          "[border-radius:var(--radius)]"
        )}
      >
        {/* Shimmer border */}
        <div className="absolute inset-0 -z-20">
          <div
            className="absolute inset-0 animate-border rounded-lg"
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

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <BrainCircuit className="w-4 h-4 text-primary/70" />{" "}
          </div>
          <span className="text-sm font-medium text-primary/90">
            Chain of Thought
          </span>
          <span className="text-xs text-primary/60">
            Thinking
            <span className="inline-flex">
              <span className="animate-[dot_1.4s_infinite] [animation-delay:0.0s]">
                .
              </span>
              <span className="animate-[dot_1.4s_infinite] [animation-delay:0.2s]">
                .
              </span>
              <span className="animate-[dot_1.4s_infinite] [animation-delay:0.4s]">
                .
              </span>
            </span>
          </span>
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
        <div className="overflow-hidden rounded-lg border border-secondary/30 animate-in slide-in-from-top-2 duration-200 w-[80%]">
          <div className="px-4 py-2.5 border-b border-secondary/30 bg-secondary/20 backdrop-blur-sm">
            <div className="text-sm font-medium text-primary/80 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary/50" />
              Reasoning Process
            </div>
          </div>

          {agentActions &&
            (agentActionsExpanded ? (
              <div className="bg-secondary/10 backdrop-blur-sm">
                <div className="px-4 py-3 text-sm break-words [overflow-wrap:anywhere] text-left overflow-hidden">
                  {agentActions}
                </div>
              </div>
            ) : (
              <div className="bg-secondary/10 backdrop-blur-sm">
                <Button onClick={() => setAgentActionsExpanded(true)}>
                  View Actions
                </Button>
              </div>
            ))}
          <div className="bg-secondary/10 backdrop-blur-sm">
            <div className="px-4 py-3 text-sm break-words [overflow-wrap:anywhere] text-left overflow-hidden">
              {parsedContent}
              <div className="sr-only">{streamingMessageReasoning}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
