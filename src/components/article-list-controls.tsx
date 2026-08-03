import Link from "next/link";
import { buildListHref } from "@/lib/articleFilters";
import type { GenreSlug } from "@/lib/constants";

type GenreOption = {
  slug: GenreSlug;
  label: string;
};

type Props = {
  q: string;
  genre: GenreSlug | "";
  genres: GenreOption[];
  resultCount: number;
  totalCount: number;
};

export function ArticleListControls({
  q,
  genre,
  genres,
  resultCount,
  totalCount,
}: Props) {
  return (
    <section className="animate-rise mb-5 rounded-[24px] border border-[var(--hairline)] bg-[var(--card-soft)] p-4 shadow-[var(--shadow)] backdrop-blur sm:p-5">
      <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row">
        {genre ? <input type="hidden" name="genre" value={genre} /> : null}
        <label className="sr-only" htmlFor="article-search">
          記事を検索
        </label>
        <input
          id="article-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="タイトル・本文から検索…"
          className="min-w-0 flex-1 rounded-2xl border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[14px] font-medium text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 px-5 py-3 text-[13px] font-extrabold text-white shadow-sm transition hover:brightness-105"
        >
          検索
        </button>
      </form>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.12em] text-[var(--mute)] uppercase">
          ジャンルで絞り込み
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildListHref({ q })}
            className="rounded-full px-3 py-1.5 text-[12px] font-bold transition"
            style={
              !genre
                ? {
                    background: "linear-gradient(90deg, #14b8a6, #38bdf8)",
                    color: "#fff",
                  }
                : {
                    background: "var(--canvas)",
                    color: "var(--ink-soft)",
                    border: "1px solid var(--hairline)",
                  }
            }
          >
            すべて
          </Link>
          {genres.map((item) => {
            const active = genre === item.slug;
            return (
              <Link
                key={item.slug}
                href={buildListHref({ q, genre: item.slug })}
                className="rounded-full px-3 py-1.5 text-[12px] font-bold transition"
                style={
                  active
                    ? {
                        background: "linear-gradient(90deg, #14b8a6, #38bdf8)",
                        color: "#fff",
                      }
                    : {
                        background: "var(--canvas)",
                        color: "var(--ink-soft)",
                        border: "1px solid var(--hairline)",
                      }
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[12px] font-semibold text-[var(--body)]">
        {q || genre
          ? `${totalCount}件中 ${resultCount}件を表示`
          : `${resultCount}件の要約`}
        {q ? (
          <span className="text-[var(--mute)]">
            {" "}
            / 「{q}」
          </span>
        ) : null}
      </p>
    </section>
  );
}
