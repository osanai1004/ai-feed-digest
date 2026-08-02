import Link from "next/link";
import { listArticles, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-16 pt-10">
      <header className="mb-8">
        <p className="mb-2 text-sm tracking-[0.18em] text-[var(--muted)] uppercase">
          Daily AI Catch-up
        </p>
        <h1
          className="text-4xl leading-tight text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          AI Feed Digest
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
          公式情報を AI
          要約で先に理解する。詳細が必要なら元URLへ。いまは一覧をタップするだけ。
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">
          storage: {mode === "neon" ? "Neon (Postgres)" : "local JSON / seed"}
        </p>
      </header>

      <section className="flex flex-col gap-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent)]">
                {article.source}
              </span>
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            </div>
            <h2 className="text-lg leading-snug font-semibold">
              {article.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
              {article.summary.conclusion}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
