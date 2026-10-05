import { X_METRIC_MAX } from "../../../src/lib/constants.ts";
import {
  canonicalHttpUrl,
  coarseFilterText,
  isOfficialPrimaryUrl,
  isXPostUrl,
  titleFromPostText,
} from "../../../src/lib/intake.ts";

export type RawTweetCard = {
  statusUrl: string;
  text: string;
  authorHandle: string | null;
  publishedAt: string | null;
  links: string[];
  metricText: string;
  isReply: boolean;
  isAd: boolean;
  topIndex: number;
};

export type PickupCandidate = {
  xPostUrl: string;
  text: string;
  title: string;
  source: string;
  author: string | null;
  publishedAt: string;
  officialUrl: string | null;
  links: string[];
  buzzScore: number;
  impressions?: number;
  reposts?: number;
  likes?: number;
};

export type SelectionDropped = {
  invalid: number;
  replyOrAd: number;
  stale: number;
  coarse: number;
  duplicate: number;
};

export type SelectionResult = {
  candidates: PickupCandidate[];
  dropped: SelectionDropped;
};

const HANDLE_SOURCES: Record<string, string> = {
  openai: "OpenAI",
  chatgptapp: "OpenAI",
  anthropicai: "Claude",
  claudeai: "Claude",
  googledeepmind: "Google DeepMind",
  googleai: "Google AI",
  geminiapp: "Gemini",
  cursor_ai: "Cursor",
  laravelphp: "Laravel",
  vercel: "Vercel",
  nextjs: "Next.js",
  github: "GitHub",
  githubcopilot: "Copilot",
  cloudflare: "Cloudflare",
  supabase: "Supabase",
  awscloud: "AWS",
};

/** 長い語を先に見る（Claude Code を Claude より優先する） */
const TEXT_SOURCES: readonly (readonly [string, string])[] = [
  ["claude code", "Claude Code"],
  ["github copilot", "Copilot"],
  ["chatgpt", "OpenAI"],
  ["openai", "OpenAI"],
  ["anthropic", "Claude"],
  ["deepmind", "Google DeepMind"],
  ["claude", "Claude"],
  ["gemini", "Gemini"],
  ["cursor", "Cursor"],
  ["next.js", "Next.js"],
  ["nextjs", "Next.js"],
  ["laravel", "Laravel"],
  ["vercel", "Vercel"],
  ["cloudflare", "Cloudflare"],
  ["supabase", "Supabase"],
  ["sagemaker", "AWS"],
  ["bedrock", "AWS"],
  ["copilot", "Copilot"],
  ["github", "GitHub"],
];

const SKIP_HOST_SUFFIXES = [
  "t.co",
  "twimg.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "fb.com",
  "instagram.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "linkedin.com",
  "threads.net",
  "bsky.app",
  "reddit.com",
  "discord.com",
  "discord.gg",
  "t.me",
];

const VENDOR_HOST_SUFFIXES = [
  "openai.com",
  "anthropic.com",
  "claude.com",
  "claude.ai",
  "deepmind.google",
  "deepmind.com",
  "blog.google",
  "ai.google.dev",
  "cursor.com",
  "laravel.com",
  "vercel.com",
  "nextjs.org",
  "github.com",
  "github.blog",
  "cloudflare.com",
  "supabase.com",
  "aws.amazon.com",
];

const METRIC_PATTERNS: readonly {
  key: "impressions" | "reposts" | "likes";
  re: RegExp;
}[] = [
  {
    key: "impressions",
    re: /([\d.,]+)\s*([KMB万億])?\s*件の表示/i,
  },
  {
    key: "impressions",
    re: /([\d.,]+)\s*([KMB万億])?\s*(?:views?|impressions?|表示回数)/i,
  },
  {
    key: "likes",
    re: /([\d.,]+)\s*([KMB万億])?\s*件のいいね/i,
  },
  {
    key: "likes",
    re: /([\d.,]+)\s*([KMB万億])?\s*(?:likes?|いいね)/i,
  },
  {
    key: "reposts",
    re: /([\d.,]+)\s*([KMB万億])?\s*件の(?:リポスト|リツイート)/i,
  },
  {
    key: "reposts",
    re: /([\d.,]+)\s*([KMB万億])?\s*(?:reposts?|retweets?|リポスト|リツイート)/i,
  },
  {
    key: "impressions",
    re: /(?:views?|impressions?|表示)\s*[:：]?\s*([\d.,]+)\s*([KMB万億])?/i,
  },
  {
    key: "likes",
    re: /(?:likes?|いいね)\s*[:：]?\s*([\d.,]+)\s*([KMB万億])?/i,
  },
  {
    key: "reposts",
    re: /(?:reposts?|retweets?|リポスト|リツイート)\s*[:：]?\s*([\d.,]+)\s*([KMB万億])?/i,
  },
];

export function normalizeStatusUrl(value: string): string | null {
  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, "https://x.com");
    const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
    if (!match) return null;
    const canonical = `https://x.com/${match[1]}/status/${match[2]}`;
    return isXPostUrl(canonical) ? canonical : null;
  } catch {
    return null;
  }
}

export function parseEngagementCount(raw: string): number | undefined {
  const compact = raw.trim().replace(/,/g, "").replace(/\s+/g, "");
  if (!compact) return undefined;
  const jp = compact.match(/^(\d+(?:\.\d+)?)(万|億)$/);
  if (jp) {
    const magnitude = jp[2] === "億" ? 100_000_000 : 10_000;
    return capMetric(Math.round(Number(jp[1]) * magnitude));
  }
  const suffix = compact.match(/^(\d+(?:\.\d+)?)([KMB])$/i);
  if (suffix) {
    const unit = suffix[2].toUpperCase();
    const magnitude = unit === "B" ? 1_000_000_000 : unit === "M" ? 1_000_000 : 1_000;
    return capMetric(Math.round(Number(suffix[1]) * magnitude));
  }
  if (/^\d+(?:\.\d+)?$/.test(compact)) return capMetric(Math.round(Number(compact)));
  return undefined;
}

function capMetric(value: number): number | undefined {
  if (!Number.isSafeInteger(value) || value < 0 || value > X_METRIC_MAX) return undefined;
  return value;
}

export function parseMetricCounts(metricText: string): {
  impressions?: number;
  reposts?: number;
  likes?: number;
} {
  const counts: { impressions?: number; reposts?: number; likes?: number } = {};
  for (const pattern of METRIC_PATTERNS) {
    if (counts[pattern.key] != null) continue;
    const match = metricText.match(pattern.re);
    if (!match) continue;
    const numeric = `${match[1] ?? ""}${match[2] ?? ""}`;
    const parsed = parseEngagementCount(numeric);
    if (parsed != null) counts[pattern.key] = parsed;
  }
  return counts;
}

export function scoreBuzz(input: {
  impressions?: number;
  likes?: number;
  reposts?: number;
  topIndex: number;
}): number {
  const topBonus = Math.max(0, 40 - input.topIndex);
  return (
    (input.impressions ?? 0) +
    (input.likes ?? 0) * 10 +
    (input.reposts ?? 0) * 25 +
    topBonus
  );
}

export function inferSource(handle: string | null, text: string): string {
  const key = handle?.replace(/^@/, "").trim().toLowerCase() ?? "";
  const fromHandle = key ? HANDLE_SOURCES[key] : undefined;
  if (fromHandle) return fromHandle;
  const haystack = text.toLowerCase();
  for (const [term, source] of TEXT_SOURCES) {
    if (haystack.includes(term)) return source;
  }
  return "X";
}

function hostMatches(hostname: string, suffix: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === suffix || host.endsWith(`.${suffix}`);
}

function shouldSkipHost(hostname: string): boolean {
  return SKIP_HOST_SUFFIXES.some((suffix) => hostMatches(hostname, suffix));
}

function vendorScore(hostname: string): number {
  return VENDOR_HOST_SUFFIXES.some((suffix) => hostMatches(hostname, suffix)) ? 2 : 1;
}

/** 公式ページを優先し、短縮URL・SNS・画像ホストは出典にしない */
export function pickOfficialUrl(links: readonly string[]): string | null {
  let best: { url: string; score: number } | null = null;
  for (const link of links) {
    let parsed: URL;
    try {
      parsed = new URL(link);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    if (shouldSkipHost(parsed.hostname)) continue;
    if (!isOfficialPrimaryUrl(parsed.toString())) continue;
    const canonical = canonicalHttpUrl(parsed.toString());
    if (!canonical) continue;
    const score = vendorScore(parsed.hostname);
    if (!best || score > best.score) {
      best = { url: canonical, score };
    }
  }
  return best?.url ?? null;
}

export async function resolveOfficialUrl(
  links: readonly string[],
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const direct = pickOfficialUrl(links);
  if (direct) return direct;
  let expanded = 0;
  for (const link of links) {
    if (expanded >= 5) break;
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.hostname !== "t.co") continue;
    expanded += 1;
    try {
      const response = await fetchImpl(url.toString(), {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": "AI-Feed-Digest/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      const location = response.headers.get("location");
      if (!location) continue;
      const absolute = new URL(location, url).toString();
      const picked = pickOfficialUrl([absolute]);
      if (picked) return picked;
    } catch {
      continue;
    }
  }
  return null;
}

function formatAuthor(handle: string | null): string | null {
  if (!handle) return null;
  const cleaned = handle.replace(/^@/, "").trim();
  if (!cleaned || /[\s/]/.test(cleaned)) return null;
  const author = `@${cleaned}`;
  return author.length <= 100 ? author : null;
}

export function selectBuzzCandidates(
  cards: readonly RawTweetCard[],
  options: { now: Date; limit: number; maxAgeMs: number },
): SelectionResult {
  const dropped: SelectionDropped = {
    invalid: 0,
    replyOrAd: 0,
    stale: 0,
    coarse: 0,
    duplicate: 0,
  };
  const best = new Map<string, PickupCandidate>();

  for (const card of cards) {
    if (card.isReply || card.isAd) {
      dropped.replyOrAd += 1;
      continue;
    }
    const xPostUrl = normalizeStatusUrl(card.statusUrl);
    if (!xPostUrl) {
      dropped.invalid += 1;
      continue;
    }
    const text = card.text.trim();
    if (coarseFilterText(text)) {
      dropped.coarse += 1;
      continue;
    }
    const published = parseTime(card.publishedAt);
    if (published && options.now.getTime() - published.getTime() > options.maxAgeMs) {
      dropped.stale += 1;
      continue;
    }
    const metrics = parseMetricCounts(card.metricText);
    const candidate: PickupCandidate = {
      xPostUrl,
      text: text.slice(0, 5000),
      title: titleFromPostText(text),
      source: inferSource(card.authorHandle, text),
      author: formatAuthor(card.authorHandle),
      publishedAt: (published ?? options.now).toISOString(),
      officialUrl: pickOfficialUrl(card.links),
      links: card.links,
      buzzScore: scoreBuzz({ ...metrics, topIndex: card.topIndex }),
    };
    if (metrics.impressions != null) candidate.impressions = metrics.impressions;
    if (metrics.reposts != null) candidate.reposts = metrics.reposts;
    if (metrics.likes != null) candidate.likes = metrics.likes;

    const existing = best.get(xPostUrl);
    if (existing) {
      dropped.duplicate += 1;
      if (candidate.buzzScore > existing.buzzScore) best.set(xPostUrl, candidate);
      continue;
    }
    best.set(xPostUrl, candidate);
  }

  const candidates = [...best.values()]
    .sort(
      (a, b) =>
        b.buzzScore - a.buzzScore || b.publishedAt.localeCompare(a.publishedAt),
    )
    .slice(0, options.limit);

  return { candidates, dropped };
}

function parseTime(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/** 確認待ちの作成順がバズの高い順になるよう、低い方から送る */
export function postOrder<T>(candidates: readonly T[]): T[] {
  return [...candidates].reverse();
}
