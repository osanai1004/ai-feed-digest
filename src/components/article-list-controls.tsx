import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { SearchField } from "@/components/ui/search-field";
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

function GenreChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`ui-chip transition${active ? " ui-chip-brand" : " ui-chip-soft"}`}
    >
      {children}
    </Link>
  );
}

export function ArticleListControls({
  q,
  genre,
  genres,
  resultCount,
  totalCount,
}: Props) {
  return (
    <Card soft className="animate-rise mb-5 p-4 sm:p-5">
      <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row">
        {genre ? <input type="hidden" name="genre" value={genre} /> : null}
        <SearchField
          id="article-search"
          name="q"
          defaultValue={q}
          placeholder="タイトル・本文から検索…"
          label="記事を検索"
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
          <GenreChip href={buildListHref({ q })} active={!genre}>
            すべて
          </GenreChip>
          {genres.map((item) => (
            <GenreChip
              key={item.slug}
              href={buildListHref({ q, genre: item.slug })}
              active={genre === item.slug}
            >
              {item.label}
            </GenreChip>
          ))}
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
    </Card>
  );
}
