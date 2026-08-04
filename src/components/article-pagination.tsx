import Link from "next/link";
import { buildListHref } from "@/lib/articleFilters";

type Props = {
  q: string;
  category: string;
  genre: string;
  page: number;
  totalPages: number;
  total: number;
};

export function ArticlePagination({
  q,
  category,
  genre,
  page,
  totalPages,
  total,
}: Props) {
  if (totalPages <= 1) return null;

  const prevHref =
    page > 1
      ? buildListHref({ q, category, genre, page: page - 1 })
      : null;
  const nextHref =
    page < totalPages
      ? buildListHref({ q, category, genre, page: page + 1 })
      : null;

  return (
    <nav
      aria-label="ページネーション"
      className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-[12px] font-semibold text-[var(--mute)]">
        {total}件中 {page} / {totalPages} ページ
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="rounded-full border border-[var(--hairline)] bg-[var(--card)] px-4 py-2 text-[12px] font-bold text-[var(--ink-soft)] shadow-sm transition hover:-translate-y-0.5"
          >
            ← 前へ
          </Link>
        ) : (
          <span className="rounded-full border border-transparent px-4 py-2 text-[12px] font-bold text-[var(--mute)]">
            ← 前へ
          </span>
        )}

        <ol className="flex flex-wrap items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => {
              const active = pageNum === page;
              return (
                <li key={pageNum}>
                  {active ? (
                    <span
                      aria-current="page"
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-sky-500 px-2 text-[12px] font-extrabold text-white"
                    >
                      {pageNum}
                    </span>
                  ) : (
                    <Link
                      href={buildListHref({
                        q,
                        category,
                        genre,
                        page: pageNum,
                      })}
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)] px-2 text-[12px] font-bold text-[var(--ink-soft)] transition hover:-translate-y-0.5"
                    >
                      {pageNum}
                    </Link>
                  )}
                </li>
              );
            },
          )}
        </ol>

        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-full border border-[var(--hairline)] bg-[var(--card)] px-4 py-2 text-[12px] font-bold text-[var(--ink-soft)] shadow-sm transition hover:-translate-y-0.5"
          >
            次へ →
          </Link>
        ) : (
          <span className="rounded-full border border-transparent px-4 py-2 text-[12px] font-bold text-[var(--mute)]">
            次へ →
          </span>
        )}
      </div>
    </nav>
  );
}
