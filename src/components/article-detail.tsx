import { ArticleActions } from "@/components/article-actions";
import { ArticleAudiencePanel } from "@/components/article-audience-panel";
import { SourceBadge, sourceToneVars, XSignalBadge } from "@/components/ui/source-badge";
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
      <div className="p-5 sm:p-8">
        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3">
          <SourceBadge source={article.source} />
          {article.origin === "x" && article.source.trim().toLowerCase() !== "x" ? (
            <XSignalBadge />
          ) : null}
          <time
            dateTime={article.publishedAt}
            className="shrink-0 text-[12px] font-semibold text-[var(--mute)]"
          >
            {formatDate(article.publishedAt, "long")}
          </time>
        </div>

        <h1 className="font-display max-w-2xl break-words text-[30px] leading-[1.12] font-black tracking-[-0.035em] sm:text-[42px]">
          {article.title}
        </h1>

        <div
          className="animate-accent-draw mt-4 h-[3px] w-14 rounded-full bg-[var(--accent)]"
          aria-hidden="true"
        />

        <ArticleActions article={article} />

        <ArticleAudiencePanel summary={article.summary} />

        {externalUrl ? (
          <div className="mt-8 border-t border-[var(--hairline)] pt-6">
            {article.origin === "x" && article.officialNote ? (
              <p className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                {article.officialNote}
              </p>
            ) : null}
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button w-full sm:w-auto"
            >
              {article.origin === "x"
                ? "公式記事で確認する →"
                : "元記事で詳細を確認する →"}
            </a>
            <p className="mt-3 text-[13px] leading-6 text-[var(--body)]">
              {article.origin === "x"
                ? "Xの投稿がきっかけです。内容の裏取りは公式の一次情報でしています。"
                : "まずカード内の要約で把握。詳しく見たいときだけ公式へ。"}
            </p>
            <p className="mt-2 break-all text-[12px] text-[var(--accent)]">
              {externalUrl}
            </p>
            {article.origin === "x" && safeExternalUrl(article.xPostUrl ?? "") ? (
              <p className="mt-4 text-[13px] leading-6">
                <a
                  href={safeExternalUrl(article.xPostUrl ?? "") ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  Xの投稿を見る
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
