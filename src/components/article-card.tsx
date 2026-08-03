import Link from "next/link";
import { SourceBadge, sourceToneVars } from "@/components/ui/source-badge";
import { formatDate } from "@/lib/formatDate";
import { toSingleLine } from "@/lib/text";
import type { Article } from "@/lib/types";

type Props = {
  article: Article;
  index: number;
};

export function ArticleCard({ article, index }: Props) {
  return (
    <Link
      href={`/articles/${article.id}`}
      className="ui-card animate-rise group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] sm:p-6"
      style={{
        ...sourceToneVars(article.source),
        animationDelay: `${Math.min(index, 6) * 60}ms`,
      }}
    >
      <div className="ui-source-bar absolute inset-y-0 left-0 w-1.5" />
      <div className="mb-3 flex items-center justify-between gap-3 pl-2">
        <SourceBadge source={article.source} />
        <time
          dateTime={article.publishedAt}
          className="text-[12px] font-semibold text-[var(--mute)]"
        >
          {formatDate(article.publishedAt, "short")}
        </time>
      </div>
      <h2 className="font-display pl-2 text-[22px] leading-snug font-bold tracking-[-0.02em] transition group-hover:text-[var(--accent-strong)] sm:text-[24px]">
        {article.title}
      </h2>
      <p className="mt-3 line-clamp-2 pl-2 text-[14px] leading-6 text-[var(--body)]">
        {toSingleLine(article.summary.conclusion)}
      </p>
      <div className="mt-4 flex items-center justify-between pl-2 text-[12px] font-bold text-[var(--accent)]">
        <span>要約を読む</span>
        <span className="transition group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
