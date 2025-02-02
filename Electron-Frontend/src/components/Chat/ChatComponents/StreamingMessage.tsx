import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SyntaxHighlightedCode } from "@/components/Chat/ChatComponents/SyntaxHightlightedCode";
import { useState, useEffect } from "react";
import { providerIcons } from "@/components/SettingsModal/SettingsComponents/providers/providerIcons";
import { useSysSettings } from "@/context/useSysSettings";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";

const MotionAvatar = motion.create(Avatar);

export function StreamingMessage({ content }: { content: string }) {
  const [parsedContent, setParsedContent] = useState<(string | JSX.Element)[]>(
    []
  );
  const { settings } = useSysSettings();

  useEffect(() => {
    const renderContent = async () => {
      const parts: (string | JSX.Element)[] = [];
      let codeBlock = "";
      let isInCodeBlock = false;
      let language = "";

      const lines = content.split("\n");
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
  }, [content]);

  return (
    <div className="flex justify-start animate-in fade-in duration-300 mx-2 my-2">
      <div className="flex flex-row items-end max-w-[80%]">
        <div className="relative">
          <MotionAvatar
            className="relative z-10 w-9 h-9 border-2 shadow-sm"
            style={
              {
                "--pulse-color": "hsl(var(--primary) / 0.3)",
                "--duration": "2s",
              } as React.CSSProperties
            }
          >
            <motion.div className="h-full w-full flex items-center justify-center">
              {settings.provider ? (
                providerIcons[settings.provider.toLowerCase()]
              ) : (
                <AvatarImage
                  className="object-cover w-full h-full scale-125"
                  src="/src/assets/avatars/ai-avatar.png"
                />
              )}
            </motion.div>
          </MotionAvatar>
          <motion.div
            className={cn(
              "absolute left-1/2 top-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2",
              "rounded-full animate-pulse"
            )}
            style={
              {
                "--pulse-color": "hsl(var(--primary) / 0.3)",
                "--duration": "2s",
              } as React.CSSProperties
            }
          />
          <motion.div
            className={cn(
              "absolute left-1/2 top-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2",
              "rounded-full animate-pulse"
            )}
            style={
              {
                "--pulse-color": "hsl(var(--primary) / 0.2)",
                "--duration": "2s",
              } as React.CSSProperties
            }
          />
        </div>
        <div className="mx-2 my-1 p-3 rounded-2xl bg-secondary text-secondary-foreground shadow-md rounded-bl-none">
          <div className="text-sm break-words text-left">{parsedContent}</div>
        </div>
      </div>
    </div>
  );
}
