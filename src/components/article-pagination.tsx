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

/** 現在ページ周辺だけを出し、端は省略記号でつなぐ */
function pageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= 1; offset += 1) {
    pages.add(current - offset);
    pages.add(current + offset);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (const pageNum of sorted) {
    const prev = result[result.length - 1];
    if (typeof prev === "number" && pageNum - prev > 1) {
      result.push("ellipsis");
    }
    result.push(pageNum);
  }
  return result;
}

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

  const items = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="ページネーション"
      className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-[12px] font-semibold text-[var(--mute)]">
        {total}件中 {page} / {totalPages} ページ
      </p>
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
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

        <ol className="flex max-w-full flex-wrap items-center justify-center gap-1">
          {items.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <li
                  key={`ellipsis-${index}`}
                  className="inline-flex h-9 min-w-6 items-center justify-center px-1 text-[12px] font-bold text-[var(--mute)]"
                  aria-hidden="true"
                >
                  …
                </li>
              );
            }

            const active = item === page;
            return (
              <li key={item}>
                {active ? (
                  <span
                    aria-current="page"
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-sky-500 px-2 text-[12px] font-extrabold text-white"
                  >
                    {item}
                  </span>
                ) : (
                  <Link
                    href={buildListHref({
                      q,
                      category,
                      genre,
                      page: item,
                    })}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)] px-2 text-[12px] font-bold text-[var(--ink-soft)] transition hover:-translate-y-0.5"
                  >
                    {item}
                  </Link>
                )}
              </li>
            );
          })}
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
