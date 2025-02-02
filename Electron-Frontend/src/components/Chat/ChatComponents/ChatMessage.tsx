import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  lazy,
  Suspense,
  useRef,
  useEffect,
  useState,
  useMemo,
  memo,
} from "react";
import { Button } from "@/components/ui/button";
import {
  NotebookPenIcon,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { getYouTubeLink, formatTimestamp, getFileName } from "@/lib/utils";
import { providerIcons } from "@/components/SettingsModal/SettingsComponents/providers/providerIcons";
import { useSysSettings } from "@/context/useSysSettings";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import { ReasoningMessage } from "./ReasoningMessage";

// Lazy load the syntax highlighter
const SyntaxHighlightedCode = lazy(() =>
  import("@/components/Chat/ChatComponents/SyntaxHightlightedCode").then(
    (module) => ({ default: module.SyntaxHighlightedCode })
  )
);

export const ChatMessage = memo(function ChatMessage({
  message,
  formatDate,
}: {
  message: Message;
  formatDate: (date: Date) => string;
}) {
  const isUser = message?.role === "user";
  const isRetrieval = message?.isRetrieval;
  const [isDataContentExpanded, setIsDataContentExpanded] = useState(false);
  const { settings } = useSysSettings();
  const [renderedContent, setRenderedContent] = useState<
    (string | JSX.Element)[]
  >([]);
  const parsedDataContent = useMemo(() => {
    if (!message.data_content) return null;
    try {
      return JSON.parse(message.data_content);
    } catch {
      return null;
    }
  }, [message.data_content]);

  const renderDataContent = useMemo(() => {
    if (!parsedDataContent) return null;
    const topk = parsedDataContent.top_k;

    return (
      <div className="flex flex-col divide-y divide-border">
        {parsedDataContent.results.map(
          (
            result: {
              content: string;
              metadata: {
                chunk_start?: number;
                chunk_end?: number;
                source: string;
                title?: string;
              };
            },
            index: number
          ) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-4 hover:bg-muted/30 transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-[6px] bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {index + 1}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Source {index + 1} of {topk}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <div className="w-full flex items-center gap-2 text-xs bg-background/80 rounded-[8px] border shadow-sm">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 min-w-0">
                      <span className="flex-shrink-0 font-medium text-muted-foreground">
                        Source:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 truncate">
                        {result.metadata.chunk_start ? (
                          <a
                            href={getYouTubeLink(
                              result.metadata.source,
                              result.metadata.chunk_start
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {result.metadata.title ||
                              getFileName(result.metadata.source)}
                          </a>
                        ) : result.metadata.source.startsWith("http") ? (
                          <a
                            href={result.metadata.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {result.metadata.title ||
                              getFileName(result.metadata.source)}
                          </a>
                        ) : (
                          <span>
                            {result.metadata.title ||
                              getFileName(result.metadata.source)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex-shrink-0 px-2 py-2 border-l">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          const source = result.metadata.source;
                          if (
                            source.includes("youtube.com") ||
                            source.includes("youtu.be")
                          ) {
                            window.open(
                              getYouTubeLink(
                                source,
                                result.metadata.chunk_start
                              ),
                              "_blank"
                            );
                          } else if (source.startsWith("http")) {
                            window.open(source, "_blank");
                          } else {
                            window.electron.openCollectionFolder(source);
                          }
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {result.metadata.chunk_start && result.metadata.chunk_end && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {formatTimestamp(result.metadata.chunk_start)} -{" "}
                        {formatTimestamp(result.metadata.chunk_end)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-foreground/90 bg-muted/30 px-3 py-2 rounded-[8px]">
                  {result.content}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    );
  }, [parsedDataContent]);

  const renderContent = async (content: string) => {
    if (isUser) {
      return [
        <div key="user-message" className="text-sm ">
          {content}
        </div>,
      ];
    }

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
            className={`contentMarkdown`}
            dangerouslySetInnerHTML={{ __html: String(result) }}
          />
        );
      }
    }

    return parts;
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = message?.content || "";
    }
  }, [message?.content]);

  useEffect(() => {
    renderContent(message?.content || "").then(setRenderedContent);
  }, [message?.content]);

  const getProviderIcon = () => {
    if (isUser) {
      return { type: "image", src: "/src/assets/avatars/user-avatar.svg" };
    }
    if (isRetrieval) {
      return { type: "image", src: "/src/assets/avatars/database-avatar.svg" };
    }
    if (settings.provider) {
      const icon = providerIcons[settings.provider.toLowerCase()];

      if (icon) {
        return {
          type: "component",
          component: icon,
        };
      }
    }
    return { type: "image", src: "/src/assets/avatars/ai-avatar.png" };
  };

  const icon = getProviderIcon();

  return (
    <>
      {!isUser && message.reasoning_content && (
        <ReasoningMessage content={message.reasoning_content} />
      )}
      <div
        className={`flex ${
          isUser ? "justify-end" : "justify-start"
        } animate-in fade-in duration-300 mx-4 my-3`}
      >
        <div
          className={`flex ${
            isUser ? "flex-row-reverse" : "flex-row"
          } items-end max-w-[85%] group gap-3`}
        >
          <Avatar
            className={`w-9 h-9 border-2 shadow-sm transition-all duration-300 ${
              isUser
                ? "border-primary/50"
                : isRetrieval
                ? "border-emerald-500/50"
                : "border-secondary/50"
            } ${
              isUser
                ? "ring-2 ring-primary ring-offset-2"
                : isRetrieval
                ? "ring-2 ring-emerald-500 ring-offset-2"
                : "ring-2 ring-secondary ring-offset-2"
            } overflow-hidden`}
          >
            {icon.type === "image" ? (
              <AvatarImage
                className="object-cover w-full h-full scale-125"
                src={icon.src}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center scale-150">
                {icon.component}
              </div>
            )}
          </Avatar>

          <div
            className={`relative px-4 py-3 rounded-[16px] break-words ${
              isUser
                ? "bg-primary/90 text-primary-foreground rounded-br-[4px] shadow-lg shadow-primary/20"
                : isRetrieval
                ? "bg-emerald-50/95 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-50 rounded-bl-[4px] border border-emerald-200/70 dark:border-emerald-800/70 shadow-lg shadow-emerald-900/5"
                : "bg-secondary/95 text-secondary-foreground rounded-bl-[4px] shadow-lg shadow-secondary/10"
            } hover:shadow-xl transition-all duration-300 ease-in-out w-full backdrop-blur-sm`}
          >
            {message.data_content && (
              <div
                className="flex flex-col gap-1.5 mb-4 select-none"
                onClick={() => setIsDataContentExpanded(!isDataContentExpanded)}
              >
                <div className="flex items-center justify-between px-2 py-1.5 rounded-[8px] bg-muted/40 hover:bg-muted/60 cursor-pointer transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-[6px] bg-primary/10">
                      <NotebookPenIcon className="w-3.5 h-3.5 text-primary/70" />
                    </div>
                    <span className="text-xs font-medium text-foreground/80">
                      Reference Notes
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary/70 rounded-[6px]">
                      {parsedDataContent?.results.length} sources
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {isDataContentExpanded ? "Hide" : "Show"} details
                    </span>
                    {isDataContentExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            )}
            {message.data_content && isDataContentExpanded && (
              <div className="mb-4 overflow-hidden border rounded-[10px]">
                <div className="px-3 py-2 border-b bg-muted/30">
                  <div className="text-xs font-medium text-foreground/70">
                    Source References
                  </div>
                </div>
                <div className="bg-background/50 backdrop-blur-sm">
                  {renderDataContent}
                </div>
              </div>
            )}
            {!isRetrieval && (
              <div className="text-sm mb-2 [overflow-wrap:anywhere] text-left overflow-hidden">
                {renderedContent}
                <div className="sr-only">{message?.content}</div>
              </div>
            )}
            <span
              className={`text-[11px] mt-4 block opacity-0 group-hover:opacity-100 transition-opacity text-right absolute bottom-1 right-3 ${
                isUser
                  ? "text-primary-foreground/70"
                  : isRetrieval
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-secondary-foreground/70"
              }`}
            >
              {message?.timestamp ? formatDate(message?.timestamp) : ""}
            </span>
          </div>
        </div>
      </div>
    </>
  );
});
