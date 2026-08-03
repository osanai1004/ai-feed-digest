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

        <section className="ui-panel mt-8 rounded-3xl p-5 sm:p-6">
          <h2 className="mb-3 text-[12px] font-extrabold tracking-[0.14em] text-[var(--chip-teal-fg)] uppercase">
            結論
          </h2>
          <div className="whitespace-pre-line text-[17px] leading-8 text-[var(--ink-soft)]">
            {article.summary.conclusion}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-4 text-[12px] font-extrabold tracking-[0.14em] text-[var(--chip-orange-fg)] uppercase">
            使えるシチュエーション
          </h2>
          <ol className="grid gap-3">
            {article.summary.situations.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="flex gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-4"
              >
                <span className="ui-source-bar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold text-white">
                  {index + 1}
                </span>
                <span className="pt-1 text-[15px] leading-7 text-[var(--ink-soft)]">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </section>

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
