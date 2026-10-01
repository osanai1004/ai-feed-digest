/** ブランド名 */
export const APP_NAME = "ようやくわかる";

/** ブランド説明の行（ヒーロー表示用） */
export const APP_DESCRIPTION_LINES = [
  "公式アプデ、長くて読む気にならない。",
  "それでも正確さは欲しい。",
  "だから要約して、",
] as const;

/** ブランド説明（OGP / meta 用の1行テキスト） */
export const APP_DESCRIPTION = `${APP_DESCRIPTION_LINES[0]}${APP_DESCRIPTION_LINES[1]}${APP_DESCRIPTION_LINES[2]}『${APP_NAME}』。`;

/** 一覧1ページあたりの記事数 */
export const ARTICLES_PER_PAGE = 20;

/** ingest で受け付ける各フィールドの最大文字数（肥大化データの保存を防ぐ） */
export const INGEST_MAX_LENGTHS = {
  source: 100,
  title: 300,
  url: 2000,
  officialNote: 200,
  signalId: 32,
  xPostUrl: 2000,
} as const;

/** 浅子が1回の POST で渡せる X 候補の上限 */
export const INTAKE_MAX_ITEMS = 20;

/** X 候補の各フィールド上限 */
export const INTAKE_MAX_LENGTHS = {
  source: 100,
  title: 300,
  text: 5000,
  author: 100,
  url: 2000,
  note: 500,
  actor: 40,
} as const;

/** 粗い自動仕分けで「短すぎる」と落とす本文の下限 */
export const COARSE_MIN_TEXT_LENGTH = 12;

/**
 * 粗い自動仕分けで通す語。
 * 製品名が無い投稿は人が見る列に出さず、filtered に残す。
 */
export const COARSE_TOPIC_TERMS = [
  "openai",
  "chatgpt",
  "gpt",
  "claude",
  "anthropic",
  "gemini",
  "deepmind",
  "cursor",
  "laravel",
  "vercel",
  "next.js",
  "nextjs",
  "github",
  "copilot",
  "cloudflare",
  "supabase",
  "bedrock",
  "sagemaker",
  "llm",
  "生成ai",
  "人工知能",
  "cve",
  "脆弱性",
] as const;

/** 公式一次情報で裏が取れた X 記事に付ける注記 */
export const OFFICIAL_CONFIRMATION_NOTE = "公式もこう言っている";

/** GET /api/intake で status を省略したときに返す作業列 */
export const INTAKE_QUEUE_STATUSES = [
  "pending_review",
  "needs_factcheck",
  "ready",
] as const;

/** 一覧の初期表示期間。同じ日の RSS で X 記事が埋もれにくくする */
export const LIST_WINDOWS = [
  { slug: "24h", label: "直近24時間" },
  { slug: "today", label: "今日" },
  { slug: "all", label: "すべて" },
] as const;

export type ListWindow = (typeof LIST_WINDOWS)[number]["slug"];

export const DEFAULT_LIST_WINDOW: ListWindow = "24h";

/**
 * ホーム最上段の入手元。
 * x は origin が x の記事。official は公式RSS（origin が x 以外）。
 * 一覧は1ページ20件なので、チャネルを分けると X が公式RSSの連続に埋もれない。
 */
export const ARTICLE_CHANNELS = [
  { slug: "x", label: "X（SNS）" },
  { slug: "official", label: "公式サイト" },
  { slug: "all", label: "All" },
] as const;

export type ArticleChannel = (typeof ARTICLE_CHANNELS)[number]["slug"];

export const DEFAULT_ARTICLE_CHANNEL: ArticleChannel = "all";

/** 直近24時間のミリ秒 */
export const LIST_WINDOW_24H_MS = 24 * 60 * 60 * 1000;

/** 同じソースがこの件数以上、近い時間に続くときは1つにまとめる */
export const SOURCE_BURST_MIN = 3;

/** まとめるときの投稿間隔の上限 */
export const SOURCE_BURST_GAP_MS = 6 * 60 * 60 * 1000;

/** 詳細ページの読者タブ */
export const AUDIENCE_VOICES = [
  { slug: "general", label: "非エンジニア向け" },
  { slug: "engineer", label: "エンジニア向け" },
] as const;

export type AudienceVoiceSlug = (typeof AUDIENCE_VOICES)[number]["slug"];

/** 読者タブの選択を覚える localStorage キー */
export const AUDIENCE_VOICE_STORAGE_KEY = "yoyaku-audience-voice";

/** 初期表示は非エンジニア向け */
export const DEFAULT_AUDIENCE_VOICE: AudienceVoiceSlug = "general";

/** 詳細ページの要約の深さタブ */
export const READ_DEPTHS = [
  { slug: "quick", label: "30秒で読む" },
  { slug: "deep", label: "詳しく読む" },
] as const;

export type ReadDepthSlug = (typeof READ_DEPTHS)[number]["slug"];

/** 要約の深さの選択を覚える localStorage キー */
export const READ_DEPTH_STORAGE_KEY = "yoyaku-read-depth";

/** 初期表示は従来どおり全文（詳しく読む） */
export const DEFAULT_READ_DEPTH: ReadDepthSlug = "deep";

/** 端末内ライブラリ（保存・既読・ウォッチ）の localStorage キー */
export const LIBRARY_STORAGE_KEY = "yoyaku-library-v1";

/** 端末内ライブラリのデータ形式バージョン（将来の移行判定用） */
export const LIBRARY_DATA_VERSION = 1;

/** 端末内に保持する記事エントリ数の上限（超過時は古い既読から削除） */
export const LIBRARY_MAX_ENTRIES = 500;

/** ウォッチキーワードの登録上限 */
export const WATCH_KEYWORDS_MAX = 20;

/** ウォッチキーワード1件の最大文字数 */
export const WATCH_KEYWORD_MAX_LENGTH = 50;

/** 一覧の表示（ライブラリ状態）フィルター */
export const LIBRARY_STATUS_FILTERS = [
  { slug: "all", label: "すべて" },
  { slug: "unread", label: "未読のみ" },
  { slug: "saved", label: "あとで読む" },
  { slug: "watched", label: "ウォッチ" },
] as const;

export type LibraryStatusFilterSlug =
  (typeof LIBRARY_STATUS_FILTERS)[number]["slug"];

/** ライブラリ状態フィルター時に一度に増やす表示件数 */
export const LIBRARY_FILTER_PAGE_SIZE = 20;

/** 詳細ページに表示する関連ニュースの最大件数 */
export const RELATED_ARTICLES_MAX = 4;

/**
 * TOP の大分類。
 * ラベルは一覧チップ用に短くしてある。hint はホバー時の説明。
 */
export const ARTICLE_CATEGORIES = [
  {
    slug: "ai-models",
    label: "モデル・API",
    hint: "モデル発表・API（OpenAI / Claude / Gemini / Bedrock）",
  },
  {
    slug: "coding-agents",
    label: "コーディングAI",
    hint: "コーディングAI・エージェント（Cursor / Claude Code / Copilot）",
  },
  {
    slug: "cloud-infra",
    label: "基盤・CDN",
    hint: "基盤・CDN・DB（Vercel / Cloudflare / Supabase）",
  },
  {
    slug: "web-frameworks",
    label: "フレームワーク",
    hint: "フレームワーク（Next.js / Laravel）",
  },
  {
    slug: "devtools",
    label: "開発ツール",
    hint: "開発ツール全般（GitHub など）",
  },
  {
    slug: "security",
    label: "セキュリティ",
    hint: "セキュリティ更新",
  },
] as const;

export type CategorySlug = (typeof ARTICLE_CATEGORIES)[number]["slug"];

/**
 * ジャンル（ベンダー近似タグ）定義。
 * source 名とタイトルに含まれる語でグループ化する。
 * 既存スラッグ（openai など）は絞り込み URL を壊さないために残す。
 */
export const ARTICLE_GENRES = [
  {
    slug: "openai",
    label: "OpenAI",
    category: "ai-models",
    keywords: ["openai", "chatgpt"],
  },
  {
    slug: "claude",
    label: "Claude",
    category: "ai-models",
    keywords: ["claude", "anthropic"],
  },
  {
    slug: "gemini",
    label: "Gemini",
    category: "ai-models",
    keywords: ["gemini", "google ai", "deepmind", "google deepmind"],
  },
  {
    slug: "aws",
    label: "AWS",
    category: "ai-models",
    keywords: ["aws", "bedrock", "sagemaker"],
  },
  {
    slug: "cursor",
    label: "Cursor",
    category: "coding-agents",
    keywords: ["cursor"],
  },
  {
    slug: "claude-code",
    label: "Claude Code",
    category: "coding-agents",
    keywords: ["claude code"],
  },
  {
    slug: "copilot",
    label: "Copilot",
    category: "coding-agents",
    keywords: ["copilot", "github copilot"],
  },
  {
    slug: "vercel",
    label: "Vercel",
    category: "cloud-infra",
    keywords: ["vercel"],
  },
  {
    slug: "cloudflare",
    label: "Cloudflare",
    category: "cloud-infra",
    keywords: ["cloudflare"],
  },
  {
    slug: "supabase",
    label: "Supabase",
    category: "cloud-infra",
    keywords: ["supabase"],
  },
  {
    slug: "laravel",
    label: "Laravel",
    category: "web-frameworks",
    keywords: ["laravel"],
  },
  {
    slug: "nextjs",
    label: "Next.js",
    category: "web-frameworks",
    keywords: ["next.js", "nextjs"],
  },
  {
    slug: "github",
    label: "GitHub",
    category: "devtools",
    keywords: ["github"],
  },
  {
    slug: "security",
    label: "セキュリティ",
    category: "security",
    keywords: ["security", "cve", "vulnerability", "脆弱性", "セキュリティ"],
  },
] as const satisfies readonly {
  slug: string;
  label: string;
  category: CategorySlug;
  keywords: readonly string[];
}[];

export type GenreSlug = (typeof ARTICLE_GENRES)[number]["slug"];
