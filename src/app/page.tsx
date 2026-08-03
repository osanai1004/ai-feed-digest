import Link from "next/link";
import { ArticleListControls } from "@/components/article-list-controls";
import { ArticlePagination } from "@/components/article-pagination";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  availableGenres,
  filterArticles,
  paginateArticles,
  parseArticleListQuery,
} from "@/lib/articleFilters";
import { listArticles, storageMode } from "@/lib/store";
import { styleForSource } from "@/lib/sourceStyles";
import { toSingleLine } from "@/lib/text";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function HomePage({ searchParams }: Props) {
  const articles = await listArticles();
  const mode = storageMode();
  const query = parseArticleListQuery(await searchParams);
  const genres = availableGenres(articles);
  const filtered = filterArticles(articles, query);
  const pageResult = paginateArticles(filtered, query.page);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-rise mb-8 overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-[var(--card-soft)] p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-teal-500 to-sky-500 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-white">
            AI更新要約
          </span>
          <ThemeToggle />
        </div>
        <h1
          className="max-w-xl text-[34px] leading-[1.08] font-bold tracking-[-0.03em] sm:text-[44px]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          ChatGPT・Claude・Geminiの
          <span className="bg-gradient-to-r from-teal-500 via-sky-500 to-orange-400 bg-clip-text text-transparent">
            公式更新を要約
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--body)]">
          結論と「使える場面」つきのカードで毎日キャッチアップ。
          気になった更新だけ元記事を開けばOK。
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold">
          <span
            className="rounded-full px-3 py-1"
            style={{
              background: "var(--chip-teal-bg)",
              color: "var(--chip-teal-fg)",
            }}
          >
            {articles.length}件の要約
          </span>
          <span
            className="rounded-full px-3 py-1"
            style={{
              background: "var(--chip-orange-bg)",
              color: "var(--chip-orange-fg)",
            }}
          >
            結論ファースト
          </span>
          <span
            className="rounded-full px-3 py-1"
            style={{
              background: "var(--chip-sky-bg)",
              color: "var(--chip-sky-fg)",
            }}
          >
            {mode === "neon" ? "自動収集中" : "サンプル表示"}
          </span>
        </div>
      </header>

      <ArticleListControls
        q={query.q}
        genre={query.genre}
        genres={genres}
        resultCount={filtered.length}
        totalCount={articles.length}
      />

      <section className="grid gap-4">
        {pageResult.items.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow)]">
            <p
              className="text-[18px] font-bold"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              該当する記事がありません
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
              検索語やジャンルを変えて、もう一度試してください。
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full border border-[var(--hairline)] bg-[var(--card-soft)] px-4 py-2 text-[12px] font-bold text-[var(--ink-soft)]"
            >
              条件をクリア
            </Link>
          </div>
        ) : (
          pageResult.items.map((article, index) => {
            const tone = styleForSource(article.source);
            return (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="animate-rise group relative overflow-hidden rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] p-5 shadow-[var(--shadow)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] sm:p-6"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ background: tone.bar }}
                />
                <div className="mb-3 flex items-center justify-between gap-3 pl-2">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.04em]"
                    style={{ background: tone.badge, color: tone.text }}
                  >
                    {article.source}
                  </span>
                  <time
                    dateTime={article.publishedAt}
                    className="text-[12px] font-semibold text-[var(--mute)]"
                  >
                    {formatDate(article.publishedAt)}
                  </time>
                </div>
                <h2
                  className="pl-2 text-[22px] leading-snug font-bold tracking-[-0.02em] transition group-hover:text-[var(--accent-strong)] sm:text-[24px]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
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
          })
        )}
      </section>

      <ArticlePagination
        q={query.q}
        genre={query.genre}
        page={pageResult.page}
        totalPages={pageResult.totalPages}
        total={pageResult.total}
      />
    </main>
  );
}
