import {
  DEFAULT_X_LIST_SORT,
  LIST_WINDOW_24H_MS,
  X_LIST_SORTS,
  X_METRIC_MAX,
  X_METRICS_REFRESH_DAYS,
  X_METRICS_REFRESH_MAX,
  X_METRICS_REFRESH_WINDOW_CAP,
  type XListSort,
} from "./constants";
import type { Article } from "./types";

export type XMetricPatch = {
  impressions?: number;
  reposts?: number;
  likes?: number;
};

export type XMetricCounts = {
  impressions: number | null;
  reposts: number | null;
  likes: number | null;
  metricsUpdatedAt: string | null;
};

const METRIC_KEYS = ["impressions", "reposts", "likes"] as const;

export function emptyXMetrics(): XMetricCounts {
  return {
    impressions: null,
    reposts: null,
    likes: null,
    metricsUpdatedAt: null,
  };
}

/** 0 以上の整数だけ通す。欠けている値や不正な値は undefined（未取得のまま） */
export function readMetricCount(value: unknown): number | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return undefined;
    value = Number(trimmed);
  }
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return undefined;
  if (value < 0 || value > X_METRIC_MAX) return undefined;
  return value;
}

function readFirstCount(
  record: Record<string, unknown>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const count = readMetricCount(record[key]);
    if (count != null) return count;
  }
  return undefined;
}

/**
 * 取り込み JSON から数値だけ取り出す。
 * 無い項目はパッチに入れない（0 として保存しない）。
 * X の public_metrics があれば、明示フィールドが無い項目だけ使う。
 */
export function readXMetricPatch(record: Record<string, unknown>): XMetricPatch {
  const nested = record.public_metrics ?? record.publicMetrics;
  const metrics =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>)
      : {};
  const patch: XMetricPatch = {};

  const impressions =
    readFirstCount(record, ["impressions", "impressionCount", "impression_count"]) ??
    readFirstCount(metrics, ["impression_count", "impressions"]);
  const reposts =
    readFirstCount(record, [
      "reposts",
      "repostCount",
      "repost_count",
      "retweetCount",
      "retweet_count",
    ]) ?? readFirstCount(metrics, ["retweet_count", "repost_count", "reposts"]);
  const likes =
    readFirstCount(record, ["likes", "likeCount", "like_count"]) ??
    readFirstCount(metrics, ["like_count", "likes"]);

  if (impressions != null) patch.impressions = impressions;
  if (reposts != null) patch.reposts = reposts;
  if (likes != null) patch.likes = likes;
  return patch;
}

export function hasXMetricPatch(patch: XMetricPatch): boolean {
  return METRIC_KEYS.some((key) => patch[key] != null);
}

export function mergeXMetrics(
  current: Partial<XMetricCounts>,
  patch: XMetricPatch,
  nowIso: string,
): { metrics: XMetricCounts; changed: boolean } {
  const metrics: XMetricCounts = {
    impressions: current.impressions ?? null,
    reposts: current.reposts ?? null,
    likes: current.likes ?? null,
    metricsUpdatedAt: current.metricsUpdatedAt ?? null,
  };
  let changed = false;
  for (const key of METRIC_KEYS) {
    const next = patch[key];
    if (next == null) continue;
    if (metrics[key] !== next) {
      metrics[key] = next;
      changed = true;
    }
  }
  if (changed) metrics.metricsUpdatedAt = nowIso;
  return { metrics, changed };
}

/** タイトルや要約は触らず、渡された数値だけを上書きする */
export function applyXMetricRefresh<T extends Partial<XMetricCounts>>(
  article: T,
  patch: XMetricPatch,
  nowIso: string,
): { article: T; changed: boolean } {
  const { metrics, changed } = mergeXMetrics(article, patch, nowIso);
  if (!changed) return { article, changed: false };
  return { article: { ...article, ...metrics }, changed: true };
}

export type MetricRefreshDecision =
  | "skip_empty"
  | "skip_window"
  | "skip_cap"
  | "refresh";

export type MetricsRefreshWindowDays =
  | { ok: true; days?: number }
  | { ok: false };

/**
 * intake JSON 先頭の metricsRefreshWindowDays。
 * キーが無い（undefined）ときは days なし。呼び出し側は既定の14日のまま。
 * 通すのは 1 以上 X_METRICS_REFRESH_WINDOW_CAP（30）以下の安全な整数だけ。
 * 小数、文字列、0以下、31以上は ok: false。上限を超えた値は30に丸めない。
 */
export function readMetricsRefreshWindowDays(value: unknown): MetricsRefreshWindowDays {
  if (value === undefined) return { ok: true };
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return { ok: false };
  if (value < 1 || value > X_METRICS_REFRESH_WINDOW_CAP) return { ok: false };
  return { ok: true, days: value };
}

export function isWithinMetricsRefreshWindow(
  publishedAt: string,
  now: Date,
  days: number = X_METRICS_REFRESH_DAYS,
): boolean {
  const published = new Date(publishedAt).getTime();
  if (!Number.isFinite(published)) return false;
  return published >= now.getTime() - days * LIST_WINDOW_24H_MS;
}

/**
 * 再送された候補の数値を、既存記事へ書くかどうか。
 * 数値が無い、公開から日数が過ぎている、このリクエストの上限を超えた、ときは書かない。
 */
export function decideMetricRefresh(input: {
  publishedAt: string;
  patch: XMetricPatch;
  now: Date;
  refreshedSoFar: number;
  limit?: number;
  windowDays?: number;
}): MetricRefreshDecision {
  if (!hasXMetricPatch(input.patch)) return "skip_empty";
  if (
    !isWithinMetricsRefreshWindow(
      input.publishedAt,
      input.now,
      input.windowDays ?? X_METRICS_REFRESH_DAYS,
    )
  ) {
    return "skip_window";
  }
  if (input.refreshedSoFar >= (input.limit ?? X_METRICS_REFRESH_MAX)) {
    return "skip_cap";
  }
  return "refresh";
}

export function parseXListSort(value: string | undefined): XListSort {
  const match = X_LIST_SORTS.find((item) => item.slug === value);
  return match?.slug ?? DEFAULT_X_LIST_SORT;
}

function byPublishedDesc(a: Article, b: Article): number {
  return b.publishedAt.localeCompare(a.publishedAt);
}

/** 数値が無い記事は 0 扱いにせず後ろへ。同数は公開が新しい順 */
function byMetricDesc(
  a: Article,
  b: Article,
  key: "impressions" | "likes",
): number {
  const left = typeof a[key] === "number" ? a[key] : null;
  const right = typeof b[key] === "number" ? b[key] : null;
  if (left == null && right == null) return byPublishedDesc(a, b);
  if (left == null) return 1;
  if (right == null) return -1;
  if (right !== left) return right - left;
  return byPublishedDesc(a, b);
}

/** Xチャネルの期間内だけ並び替える。表示回数・いいねが無い記事は 0 扱いにせず後ろへ */
export function sortXChannelArticles(
  articles: Article[],
  sort: XListSort,
): Article[] {
  const copy = [...articles];
  if (sort === "impressions" || sort === "likes") {
    copy.sort((a, b) => byMetricDesc(a, b, sort));
    return copy;
  }
  copy.sort(byPublishedDesc);
  return copy;
}

export function formatMetricCount(value: number): string {
  return value.toLocaleString("ja-JP");
}

export function patchFromCounts(counts: XMetricCounts): XMetricPatch {
  const patch: XMetricPatch = {};
  for (const key of METRIC_KEYS) {
    const value = counts[key];
    if (typeof value === "number") patch[key] = value;
  }
  return patch;
}
