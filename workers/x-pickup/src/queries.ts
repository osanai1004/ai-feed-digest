/**
 * 監視製品に寄せた X 検索（Top）。
 * サーバーの粗い仕分け（製品名が本文にあるか）と同じ語を検索側でも使う。
 * 返信は検索時点で外す。
 */
export const X_SEARCH_BASES = [
  '(OpenAI OR ChatGPT OR Claude OR Anthropic OR Gemini OR "Claude Code" OR Cursor OR Copilot OR "生成AI") -filter:replies',
  '(Vercel OR "Next.js" OR Laravel OR Cloudflare OR Supabase OR Bedrock OR GitHub OR CVE OR 脆弱性) -filter:replies',
] as const;

export function sinceDateUtc(now: Date, maxAgeHours: number): string {
  const start = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);
  return start.toISOString().slice(0, 10);
}

export function buildSearchQuery(base: string, since: string): string {
  return `${base} since:${since}`;
}

export function searchUrl(query: string, tab: "top" | "live"): string {
  const filter = tab === "live" ? "live" : "top";
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=${filter}`;
}
