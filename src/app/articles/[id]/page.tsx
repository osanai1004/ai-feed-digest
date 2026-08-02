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
    <main className="mx-auto min-h-full w-full max-w-3xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-8 border-b border-[var(--hairline)] pb-4 text-[12px] font-bold tracking-[0.08em] uppercase">
        <Link href="/" className="hover:underline">
          ← Index
        </Link>
      </div>

      <article>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] font-bold tracking-[0.06em] uppercase">
          <span>{article.source}</span>
          <span className="text-[var(--body)]">/</span>
          <time
            dateTime={article.publishedAt}
            className="font-normal text-[var(--body)]"
          >
            {formatDate(article.publishedAt)}
          </time>
        </div>

        <h1
          className="max-w-2xl text-[36px] leading-[1.08] tracking-[-0.02em] sm:text-[48px]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {article.title}
        </h1>

        <section className="mt-10 border-t border-[var(--hairline)] pt-8">
          <h2 className="mb-4 text-[12px] font-bold tracking-[0.08em] uppercase">
            結論
          </h2>
          <div
            className="whitespace-pre-line text-[19px] leading-[1.55] tracking-[0.01em] text-[var(--ink-soft)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {article.summary.conclusion}
          </div>
        </section>

        <section className="mt-10 border-t border-[var(--hairline)] pt-8">
          <h2 className="mb-5 text-[12px] font-bold tracking-[0.08em] uppercase">
            使えるシチュエーション
          </h2>
          <ol className="space-y-0">
            {article.summary.situations.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="grid grid-cols-[2rem_1fr] gap-3 border-b border-[var(--hairline)] py-4 text-[16px] leading-7 last:border-b-0"
              >
                <span className="pt-0.5 text-[12px] font-bold tracking-[0.06em] text-[var(--body)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-12 border-t border-[var(--hairline)] pt-8">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-[var(--ink)] px-5 py-3 text-[14px] font-bold tracking-[0.04em] text-white hover:bg-[var(--ink-soft)]"
          >
            元記事で詳細を確認する
          </a>
          <p className="mt-4 max-w-xl text-[13px] leading-6 text-[var(--body)]">
            まずここで把握し、必要なときだけ公式ページへ進む。
          </p>
          <p className="mt-2 text-[13px]">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--link)] underline underline-offset-2"
            >
              {article.url}
            </a>
          </p>
        </div>
      </article>
    </main>
  );
}
