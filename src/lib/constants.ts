/** ブランド名 */
export const APP_NAME = "ようやくわかる";

/** ブランド説明（ヒーロー / OGP 共通） */
export const APP_DESCRIPTION =
  "長い記事も、要約すればようやくわかる。AIや開発ツールの更新を、結論と使える場面だけで。";

/** 一覧1ページあたりの記事数 */
export const ARTICLES_PER_PAGE = 20;

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
