import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/store";

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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-16 pt-8">
      <Link
        href="/"
        className="mb-6 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
      >
        ← 一覧へ
      </Link>

      <article className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] px-6 py-7 shadow-[var(--shadow)]">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent)]">
            {article.source}
          </span>
          <time dateTime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
        </div>

        <h1
          className="text-3xl leading-tight"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {article.title}
        </h1>

        <section className="mt-8">
          <h2 className="mb-3 text-sm tracking-[0.16em] text-[var(--muted)] uppercase">
            結論
          </h2>
          <div className="whitespace-pre-line text-[17px] leading-8">
            {article.summary.conclusion}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm tracking-[0.16em] text-[var(--muted)] uppercase">
            使えるシチュエーション
          </h2>
          <ol className="space-y-3">
            {article.summary.situations.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="rounded-2xl bg-[var(--accent-soft)]/50 px-4 py-3 text-[15px] leading-relaxed"
              >
                <span className="mr-2 font-semibold text-[var(--accent)]">
                  {index + 1}.
                </span>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10 border-t border-[var(--card-border)] pt-6">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            元記事で詳細を確認する
          </a>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            アプリ内の要約で概要を把握し、必要なら公式ページへ。
          </p>
        </div>
      </article>
    </main>
  );
}
