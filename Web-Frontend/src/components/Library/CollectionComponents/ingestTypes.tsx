export const implementedFileTypes = [
  ".md",
  ".html",
  ".json",
  ".py",
  ".txt",
  ".csv",
] as const;

export const comingSoonFileTypes = [
  ".pdf",
  ".doc",
  ".docx",
  ".pptx",
  ".xlsx",
] as const;

export const implementedLinkTypes = [
  {
    icon: "🌐",
    name: "Website",
    value: "website",
    description: "Single webpage",
  },
  {
    icon: "🎥",
    name: "YouTube",
    value: "youtube",
    description: "Video content",
  },
  {
    icon: "🕷️",
    name: "Web Crawl",
    value: "crawl",
    description: "Crawl websites",
  },
  {
    icon: "📚",
    name: "Documentation",
    value: "documentation",
    description: "Read the Docs",
  },
] as const;
