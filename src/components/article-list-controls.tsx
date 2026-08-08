import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { SearchField } from "@/components/ui/search-field";
import { buildListHref } from "@/lib/articleFilters";
import type { CategorySlug, GenreSlug } from "@/lib/constants";

type CategoryOption = {
  slug: CategorySlug;
  label: string;
};

type GenreOption = {
  slug: GenreSlug;
  label: string;
};

type Props = {
  q: string;
  category: CategorySlug | "";
  genre: GenreSlug | "";
  categories: CategoryOption[];
  genres: GenreOption[];
  resultCount: number;
  totalCount: number;
};

function FilterChip({
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
  category,
  genre,
  categories,
  genres,
  resultCount,
  totalCount,
}: Props) {
  const hasFilter = Boolean(q || category || genre);

  return (
    <Card soft className="animate-rise mb-5 p-4 sm:p-5">
      <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row">
        {category ? (
          <input type="hidden" name="category" value={category} />
        ) : null}
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
          種別で絞り込み
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip href={buildListHref({ q })} active={!category && !genre}>
            すべて
          </FilterChip>
          {categories.map((item) => (
            <FilterChip
              key={item.slug}
              href={buildListHref({ q, category: item.slug })}
              active={category === item.slug && !genre}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {genres.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-extrabold tracking-[0.12em] text-[var(--mute)] uppercase">
            ソースで絞り込み
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              href={buildListHref({ q, category: category || undefined })}
              active={!genre}
            >
              すべて
            </FilterChip>
            {genres.map((item) => (
              <FilterChip
                key={item.slug}
                href={buildListHref({
                  q,
                  category: category || undefined,
                  genre: item.slug,
                })}
                active={genre === item.slug}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 min-w-0 break-words text-[12px] font-semibold text-[var(--body)]">
        {hasFilter
          ? `${totalCount}件中 ${resultCount}件を表示`
          : `${resultCount}件の要約`}
        {q ? (
          <span className="break-all text-[var(--mute)]">
            {" "}
            / 「{q}」
          </span>
        ) : null}
      </p>
    </Card>
  );
}
