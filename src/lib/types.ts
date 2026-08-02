export type ArticleSummary = {
  /** 結論ファースト（3行程度） */
  conclusion: string;
  /** 使えるシチュエーション（3点） */
  situations: string[];
};

export type Article = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: ArticleSummary;
  createdAt: string;
};

export type IngestPayload = {
  source: string;
  title: string;
  url: string;
  publishedAt?: string;
  summary: ArticleSummary;
};
