/** ブランド名 */
export const APP_NAME = "ようやくわかる";

/** ブランド説明の行（ヒーロー表示用） */
export const APP_DESCRIPTION_LINES = [
  "長い記事も、要約すればわかる。",
  "情報のキャッチアップを効率的に。かつ、正確にご案内します。",
] as const;

/** ブランド説明（OGP / meta 用の1行テキスト） */
export const APP_DESCRIPTION = `${APP_DESCRIPTION_LINES[0]}それが『${APP_NAME}』${APP_DESCRIPTION_LINES[1]}`;

/** 一覧1ページあたりの記事数 */
export const ARTICLES_PER_PAGE = 20;

/** ingest で受け付ける各フィールドの最大文字数（肥大化データの保存を防ぐ） */
export const INGEST_MAX_LENGTHS = {
  source: 100,
  title: 300,
  url: 2000,
} as const;

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
