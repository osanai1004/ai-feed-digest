import Link from "next/link";
import { listArticles, storageMode } from "@/lib/store";
import { styleForSource } from "@/lib/sourceStyles";

export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  const articles = await listArticles();
  const mode = storageMode();

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-rise mb-8 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-[var(--ink)] px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
            Daily Catch-up
          </span>
          <span className="animate-float inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 text-lg text-white shadow-md">
            ✦
          </span>
        </div>
        <h1
          className="max-w-xl text-[34px] leading-[1.08] font-bold tracking-[-0.03em] sm:text-[44px]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          AIの更新を、
          <span className="bg-gradient-to-r from-teal-600 via-sky-600 to-orange-500 bg-clip-text text-transparent">
            ポップに把握
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--body)]">
          結論と使える場面つき。カードをタップしてサクッと読んで、必要なら元記事へ。
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold text-[var(--ink-soft)]">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">
            {articles.length} articles
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
            summary first
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">
            {mode === "neon" ? "neon db" : "local / seed"}
          </span>
        </div>
      </header>

      <section className="grid gap-4">
        {articles.map((article, index) => {
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
                className="pl-2 text-[22px] leading-snug font-bold tracking-[-0.02em] transition group-hover:text-sky-700 sm:text-[24px]"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {article.title}
              </h2>
              <p className="mt-3 line-clamp-2 pl-2 text-[14px] leading-6 text-[var(--body)]">
                {article.summary.conclusion.replace(/\n/g, " ")}
              </p>
              <div className="mt-4 flex items-center justify-between pl-2 text-[12px] font-bold text-[var(--accent)]">
                <span>要約を読む</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
