import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { getArticle } from "@/lib/store";
import { styleForSource } from "@/lib/sourceStyles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const tone = styleForSource(article.source);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-[var(--hairline)] bg-[var(--card-soft)] px-4 py-2 text-[12px] font-bold text-[var(--ink-soft)] shadow-sm backdrop-blur transition hover:-translate-y-0.5"
        >
          ← 一覧へ
        </Link>
        <ThemeToggle />
      </div>

      <article className="animate-rise overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${tone.bar}, #38bdf8, #fb923c)`,
          }}
        />
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
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

          <h1
            className="max-w-2xl text-[30px] leading-[1.15] font-bold tracking-[-0.03em] sm:text-[40px]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {article.title}
          </h1>

          <section
            className="mt-8 rounded-3xl p-5 sm:p-6"
            style={{ background: "var(--panel)" }}
          >
            <h2
              className="mb-3 text-[12px] font-extrabold tracking-[0.14em] uppercase"
              style={{ color: "var(--chip-teal-fg)" }}
            >
              結論
            </h2>
            <div className="whitespace-pre-line text-[17px] leading-8 text-[var(--ink-soft)]">
              {article.summary.conclusion}
            </div>
          </section>

          <section className="mt-6">
            <h2
              className="mb-4 text-[12px] font-extrabold tracking-[0.14em] uppercase"
              style={{ color: "var(--chip-orange-fg)" }}
            >
              使えるシチュエーション
            </h2>
            <ol className="grid gap-3">
              {article.summary.situations.map((item, index) => (
                <li
                  key={`${index}-${item}`}
                  className="flex gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-4"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold text-white"
                    style={{ background: tone.bar }}
                  >
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
    </main>
  );
}
