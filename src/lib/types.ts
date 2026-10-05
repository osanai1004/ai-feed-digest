export type AudienceVoice = "general" | "engineer";

export type ArticleTerm = {
  /** 用語（固有名詞・略語） */
  term: string;
  /** 一口解説（その読者向けの言い方） */
  plain: string;
};

/** 読者向けボイス1つ分（結論・詳細・場面・用語） */
export type AudienceSummary = {
  /** 30秒で読む用の短い結論（改行区切り可） */
  conclusion: string;
  /**
   * 詳しく読む用の詳細内容。
   * 結論を繰り返さず、背景・変更点・注意点を補足する。
   * 旧データや未生成時は空文字。
   */
  detail: string;
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

/** rss: 公式フィード由来。x: Xの投稿を人が確認して記事化したもの。公式URLが無ければ url は投稿URL */
export type ArticleOrigin = "rss" | "x";

export type Article = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: ArticleSummary;
  createdAt: string;
  /** 省略時は rss */
  origin?: ArticleOrigin;
  /** origin が x のとき、きっかけになった投稿の URL */
  xPostUrl?: string | null;
  /** origin が x のとき、公式一次情報がある旨の注記 */
  officialNote?: string | null;
  /** 未取得は null。0 は実際のゼロ件 */
  impressions?: number | null;
  reposts?: number | null;
  likes?: number | null;
  /** 表示回数などを最後に書いた時刻 */
  metricsUpdatedAt?: string | null;
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
  /** 省略時は rss。x のときは url を公式ページ、無ければ xPostUrl と同じ投稿URLにする */
  origin?: ArticleOrigin;
  xPostUrl?: string;
  officialNote?: string;
  /** ready の X 候補を記事に紐付ける */
  signalId?: string;
  impressions?: number;
  reposts?: number;
  likes?: number;
};

/** X候補の進行状態（記事そのものではない） */
export const INTAKE_STATUSES = [
  "filtered",
  "pending_review",
  "needs_factcheck",
  "ready",
  "memo",
  "rejected",
  "ingested",
] as const;

export type IntakeStatus = (typeof INTAKE_STATUSES)[number];

export const INTAKE_ACTIONS = [
  "approve",
  "reject",
  "flag_factcheck",
  "resolve_factcheck",
  "restore",
] as const;

export type IntakeAction = (typeof INTAKE_ACTIONS)[number];

/**
 * X の投稿候補。
 * 収集ワーカー、または人が、本文・投稿URL・あれば公式URLを /api/intake に渡す。
 */
export type IntakeSignal = {
  id: string;
  xPostUrl: string;
  source: string;
  title: string;
  body: string;
  author: string | null;
  publishedAt: string;
  status: IntakeStatus;
  filterReason: string | null;
  officialUrl: string | null;
  factcheckNote: string | null;
  articleId: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  impressions: number | null;
  reposts: number | null;
  likes: number | null;
  metricsUpdatedAt: string | null;
};
