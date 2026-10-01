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
  { key: "impressions", label: "表示", hero: true },
  { key: "reposts", label: "リポスト", hero: false },
  { key: "likes", label: "いいね", hero: false },
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

function MetricBadge({
  label,
  value,
  hero,
}: {
  label: string;
  value: number;
  hero: boolean;
}) {
  const count = formatMetricCount(value);
  if (hero) {
    return (
      <span className="ui-metric-hero">
        <span className="ui-metric-hero-label">{label}</span>
        <span className="ui-metric-hero-value">{count}</span>
      </span>
    );
  }
  return (
    <span className="ui-metric-chip">
      <span className="ui-metric-chip-label">{label}</span>
      <span className="ui-metric-chip-value">{count}</span>
    </span>
  );
}

/**
 * 数値が無い項目は出さない。0 は実数として出す。表示回数だけ大きく出す。
 * 公開日と同じメタ行に置く。操作ボタンの横には置かない。
 */
export function XEngagementMeta({ article, className = "" }: Props) {
  if (article.origin !== "x") return null;
  const parts = FIELDS.flatMap((field) => {
    const value = article[field.key];
    if (typeof value !== "number") return [];
    return [{ key: field.key, label: field.label, value, hero: field.hero }];
  });
  if (parts.length === 0) return null;

  return (
    <div className={`ui-metric-row ${className}`.trim()}>
      {parts.map((part) => (
        <MetricBadge
          key={part.key}
          label={part.label}
          value={part.value}
          hero={part.hero}
        />
      ))}
      {article.metricsUpdatedAt ? (
        <time
          dateTime={article.metricsUpdatedAt}
          className="ui-metric-updated"
        >
          数値更新 {metricUpdatedLabel(article.metricsUpdatedAt)}
        </time>
      ) : null}
    </div>
  );
}
