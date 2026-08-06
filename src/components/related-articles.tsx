import Link from "next/link";
import { SourceBadge, sourceToneVars } from "@/components/ui/source-badge";
import { formatDate } from "@/lib/formatDate";
import type { Article } from "@/lib/types";

type Props = {
  articles: Article[];
};

/** 詳細ページ下部の関連ニュース（同じテーマ・同じ情報源を新しい順で表示） */
export function RelatedArticles({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section className="animate-rise mt-8" aria-labelledby="related-articles-heading">
      <h2
        id="related-articles-heading"
        className="font-display text-[20px] font-bold tracking-[-0.02em]"
      >
        関連ニュース
      </h2>
      <p className="mt-1 text-[13px] leading-6 text-[var(--body)]">
        同じテーマ・同じ情報源の記事を新しい順に表示しています。
      </p>
      <ul className="mt-4 grid gap-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/articles/${article.id}`}
              className="ui-card group flex items-center justify-between gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
              style={sourceToneVars(article.source)}
            >
              <div className="min-w-0">
                <SourceBadge source={article.source} />
                <h3 className="mt-2 truncate text-[15px] leading-6 font-bold transition group-hover:text-[var(--accent-strong)]">
                  {article.title}
                </h3>
              </div>
              <time
                dateTime={article.publishedAt}
                className="shrink-0 text-[12px] font-semibold text-[var(--mute)]"
              >
                {formatDate(article.publishedAt, "short")}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
