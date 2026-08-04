import { ArticleAudiencePanel } from "@/components/article-audience-panel";
import { SourceBadge, sourceToneVars } from "@/components/ui/source-badge";
import { formatDate } from "@/lib/formatDate";
import type { Article } from "@/lib/types";

type Props = {
  article: Article;
};

export function ArticleDetail({ article }: Props) {
  return (
    <article
      className="ui-detail-shell animate-rise overflow-hidden"
      style={sourceToneVars(article.source)}
    >
      <div className="ui-source-topbar" />
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SourceBadge source={article.source} />
          <time
            dateTime={article.publishedAt}
            className="text-[12px] font-semibold text-[var(--mute)]"
          >
            {formatDate(article.publishedAt, "long")}
          </time>
        </div>

        <h1 className="font-display max-w-2xl text-[30px] leading-[1.15] font-bold tracking-[-0.03em] sm:text-[40px]">
          {article.title}
        </h1>

        <ArticleAudiencePanel summary={article.summary} />

        <div className="mt-8 border-t border-[var(--hairline)] pt-6">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
          >
            元記事で詳細を確認する →
          </a>
          <p className="mt-3 text-[13px] leading-6 text-[var(--body)]">
            まずカード内の要約で把握。詳しく見たいときだけ公式へ。
          </p>
          <p className="mt-2 break-all text-[12px] text-[var(--accent)]">
            {article.url}
          </p>
        </div>
      </div>
    </article>
  );
}
