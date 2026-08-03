/** 一覧1ページあたりの記事数 */
export const ARTICLES_PER_PAGE = 20;

/**
 * ジャンル（大枠タグ）定義。
 * source 名に含まれる語でグループ化する。
 */
export const ARTICLE_GENRES = [
  {
    slug: "openai",
    label: "OpenAI",
    keywords: ["openai", "chatgpt"],
  },
  {
    slug: "claude",
    label: "Claude",
    keywords: ["claude", "anthropic"],
  },
  {
    slug: "gemini",
    label: "Gemini",
    keywords: ["gemini", "google ai", "deepmind", "google deepmind"],
  },
  {
    slug: "cursor",
    label: "Cursor",
    keywords: ["cursor"],
  },
  {
    slug: "laravel",
    label: "Laravel",
    keywords: ["laravel"],
  },
  {
    slug: "vercel",
    label: "Vercel",
    keywords: ["vercel"],
  },
  {
    slug: "nextjs",
    label: "Next.js",
    keywords: ["next.js", "nextjs"],
  },
  {
    slug: "huggingface",
    label: "Hugging Face",
    keywords: ["hugging face", "huggingface"],
  },
  {
    slug: "github",
    label: "GitHub",
    keywords: ["github"],
  },
  {
    slug: "cloudflare",
    label: "Cloudflare",
    keywords: ["cloudflare"],
  },
] as const;

export type GenreSlug = (typeof ARTICLE_GENRES)[number]["slug"];
