import { formatDate } from "@/lib/formatDate";
import type { Article } from "@/lib/types";
import { formatMetricCount } from "@/lib/xMetrics";

type EngagementProps = {
  article: Pick<Article, "origin" | "impressions" | "reposts" | "likes">;
  className?: string;
};

type PublishProps = {
  article: Pick<Article, "origin" | "publishedAt" | "metricsUpdatedAt">;
  dateStyle: "short" | "long";
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

function MetricsUpdatedCue({
  article,
}: {
  article: Pick<Article, "origin" | "metricsUpdatedAt">;
}) {
  if (article.origin !== "x" || !article.metricsUpdatedAt) return null;
  return (
    <time
      dateTime={article.metricsUpdatedAt}
      className="ui-metric-updated whitespace-nowrap"
    >
      数値更新 {metricUpdatedLabel(article.metricsUpdatedAt)}
    </time>
  );
}

/** 公開日の直後に、指標を最後に書いた時刻だけを並べる */
export function ArticlePublishMeta({ article, dateStyle }: PublishProps) {
  return (
    <div className="flex max-w-full flex-wrap items-baseline gap-x-2">
      <time
        dateTime={article.publishedAt}
        className="shrink-0 text-[12px] font-semibold text-[var(--mute)]"
      >
        {formatDate(article.publishedAt, dateStyle)}
      </time>
      <MetricsUpdatedCue article={article} />
    </div>
  );
}

/** 数値が無い項目は出さない。0 は実数として出す。表示回数だけ大きく出す */
export function XEngagementMeta({
  article,
  className = "pl-2.5",
}: EngagementProps) {
  if (article.origin !== "x") return null;
  const parts = FIELDS.flatMap((field) => {
    const value = article[field.key];
    if (typeof value !== "number") return [];
    return [{ key: field.key, label: field.label, value, hero: field.hero }];
  });
  if (parts.length === 0) return null;

  return (
    <div className={`ui-metric-row mt-3 ${className}`}>
      {parts.map((part) => (
        <MetricBadge
          key={part.key}
          label={part.label}
          value={part.value}
          hero={part.hero}
        />
      ))}
    </div>
  );
}
