import { formatDate } from "@/lib/formatDate";
import type { Article } from "@/lib/types";
import { formatMetricCount } from "@/lib/xMetrics";

type Props = {
  article: Pick<
    Article,
    "origin" | "impressions" | "reposts" | "likes" | "metricsUpdatedAt"
  >;
  className?: string;
};

const FIELDS = [
  { key: "impressions", label: "表示" },
  { key: "reposts", label: "リポスト" },
  { key: "likes", label: "いいね" },
] as const;

function metricUpdatedLabel(value: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return formatDate(value, "short");
  }
}

/** 数値が無い項目は出さない。0 は実数として出す */
export function XEngagementMeta({ article, className = "pl-2.5" }: Props) {
  if (article.origin !== "x") return null;
  const parts = FIELDS.flatMap((field) => {
    const value = article[field.key];
    if (typeof value !== "number") return [];
    return [{ label: field.label, value }];
  });
  if (parts.length === 0) return null;

  return (
    <p
      className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[var(--ink-soft)] ${className}`}
    >
      {parts.map((part) => (
        <span key={part.label}>
          {part.label} {formatMetricCount(part.value)}
        </span>
      ))}
      {article.metricsUpdatedAt ? (
        <time
          dateTime={article.metricsUpdatedAt}
          className="font-medium text-[var(--mute)]"
        >
          数値更新 {metricUpdatedLabel(article.metricsUpdatedAt)}
        </time>
      ) : null}
    </p>
  );
}
