export type AudienceVoice = "general" | "engineer";

export type ArticleTerm = {
  /** 用語（固有名詞・略語） */
  term: string;
  /** 一口解説（その読者向けの言い方） */
  plain: string;
};

/** 読者向けボイス1つ分（結論・場面・用語） */
export type AudienceSummary = {
  conclusion: string;
  situations: string[];
  terms: ArticleTerm[];
};

/**
 * 記事要約は同じ事実を2ボイスで持つ。
 * - general: 非エンジニア向け
 * - engineer: エンジニア向け
 */
export type ArticleSummary = {
  general: AudienceSummary;
  engineer: AudienceSummary;
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

/** 旧形式（単一ボイス）も ingest で受け付ける */
export type LegacyArticleSummary = {
  conclusion: string;
  situations: string[];
};

export type IngestPayload = {
  source: string;
  title: string;
  url: string;
  publishedAt?: string;
  summary: ArticleSummary | LegacyArticleSummary;
};
