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
    <main className="mx-auto min-h-full w-full max-w-3xl px-5 pb-20 pt-8 sm:px-8">
      <header className="border-b border-[var(--hairline)] pb-8">
        <div className="mb-6 flex items-center justify-between text-[12px] font-bold tracking-[0.08em] uppercase">
          <span>AI Feed Digest</span>
          <span className="text-[var(--body)]">{formatDate(new Date().toISOString())}</span>
        </div>
        <h1
          className="max-w-xl text-[42px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          公式更新を、先に理解する。
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-7 text-[var(--body)]">
          結論と使える場面だけを残した日次リーダー。詳細が必要なら元記事へ。
        </p>
        <p className="mt-4 text-[12px] tracking-[0.04em] text-[var(--body)] uppercase">
          storage · {mode === "neon" ? "neon postgres" : "local / seed"}
        </p>
      </header>

      <section className="mt-2">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="group block border-b border-[var(--hairline)] py-7 transition-colors hover:bg-[var(--canvas-soft)]"
          >
            <div className="mb-3 flex items-center gap-3 text-[12px] font-bold tracking-[0.06em] uppercase">
              <span>{article.source}</span>
              <span className="text-[var(--body)]">/</span>
              <time
                dateTime={article.publishedAt}
                className="font-normal text-[var(--body)]"
              >
                {formatDate(article.publishedAt)}
              </time>
            </div>
            <h2
              className="text-[26px] leading-[1.15] tracking-[-0.015em] group-hover:underline sm:text-[32px]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {article.title}
            </h2>
            <p className="mt-3 line-clamp-2 max-w-2xl text-[15px] leading-6 text-[var(--body)]">
              {article.summary.conclusion.replace(/\n/g, " ")}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
