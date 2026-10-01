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
  "cloudflare",
  "supabase",
  "bedrock",
  "sagemaker",
  "llm",
  "生成ai",
  "人工知能",
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

/** TOP の大分類（AI / 開発ツール） */
export const ARTICLE_CATEGORIES = [
  { slug: "ai", label: "AI" },
  { slug: "devtools", label: "開発ツール" },
] as const;

export type CategorySlug = (typeof ARTICLE_CATEGORIES)[number]["slug"];

/**
 * ジャンル（ベンダー近似タグ）定義。
 * source 名に含まれる語でグループ化する。
 */
export const ARTICLE_GENRES = [
  {
    slug: "openai",
    label: "OpenAI",
    category: "ai",
    keywords: ["openai", "chatgpt"],
  },
  {
    slug: "claude",
    label: "Claude",
    category: "ai",
    keywords: ["claude", "anthropic"],
  },
  {
    slug: "gemini",
    label: "Gemini",
    category: "ai",
    keywords: ["gemini", "google ai", "deepmind", "google deepmind"],
  },
  {
    slug: "cursor",
    label: "Cursor",
    category: "ai",
    keywords: ["cursor"],
  },
  {
    slug: "aws",
    label: "AWS",
    category: "ai",
    keywords: ["aws"],
  },
  {
    slug: "laravel",
    label: "Laravel",
    category: "devtools",
    keywords: ["laravel"],
  },
  {
    slug: "vercel",
    label: "Vercel",
    category: "devtools",
    keywords: ["vercel"],
  },
  {
    slug: "nextjs",
    label: "Next.js",
    category: "devtools",
    keywords: ["next.js", "nextjs"],
  },
  {
    slug: "github",
    label: "GitHub",
    category: "devtools",
    keywords: ["github"],
  },
  {
    slug: "cloudflare",
    label: "Cloudflare",
    category: "devtools",
    keywords: ["cloudflare"],
  },
  {
    slug: "supabase",
    label: "Supabase",
    category: "devtools",
    keywords: ["supabase"],
  },
] as const;

export type GenreSlug = (typeof ARTICLE_GENRES)[number]["slug"];
