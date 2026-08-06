import { ArticleActions } from "@/components/article-actions";
import { ArticleAudiencePanel } from "@/components/article-audience-panel";
import { SourceBadge, sourceToneVars } from "@/components/ui/source-badge";
import { formatDate } from "@/lib/formatDate";
import { safeExternalUrl } from "@/lib/safeUrl";
import type { Article } from "@/lib/types";

type Props = {
  article: Article;
};

export function ArticleDetail({ article }: Props) {
  // 既存データにも不正スキームが混ざり得るため表示側でも防ぐ
  const externalUrl = safeExternalUrl(article.url);

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

        <ArticleActions article={article} />

        <ArticleAudiencePanel summary={article.summary} />

        {externalUrl ? (
          <div className="mt-8 border-t border-[var(--hairline)] pt-6">
            <a
              href={externalUrl}
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
              {externalUrl}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
