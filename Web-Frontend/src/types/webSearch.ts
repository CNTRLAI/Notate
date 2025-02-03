export type WebSearchResult = {
  metadata: {
    title: string;
    source: string;
    description: string;
    author: string;
    keywords: string;
    ogImage: string;
  };
  textContent: string;
};
