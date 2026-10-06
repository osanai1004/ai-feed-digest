import Link from "next/link";
import type { ReactNode } from "react";
import { SearchField } from "@/components/ui/search-field";
import { buildListHref } from "@/lib/articleFilters";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CHANNELS,
  ARTICLE_GENRES,
  DEFAULT_ARTICLE_CHANNEL,
  DEFAULT_LIST_WINDOW,
  LIST_WINDOWS,
  X_LIST_SORTS,
  type ArticleChannel,
  type CategorySlug,
  type GenreSlug,
  type ListWindow,
  type XListSort,
} from "@/lib/constants";

type CategoryOption = {
  slug: CategorySlug;
  label: string;
  hint?: string;
};

type GenreOption = {
  slug: GenreSlug;
  label: string;
};

type Props = {
  q: string;
  channel: ArticleChannel;
  category: CategorySlug | "";
  genre: GenreSlug | "";
  window: ListWindow;
  sort: XListSort;
  categories: CategoryOption[];
  genres: GenreOption[];
};

function FilterChip({
  href,
  active,
  title,
  children,
}: {
  href: string;
  active: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-current={active ? "true" : undefined}
      className={`ui-chip whitespace-nowrap transition${active ? " ui-chip-brand" : " ui-chip-soft"}`}
    >
      {children}
    </Link>
  );
}

function selectedLabel(
  slug: string,
  options: readonly { slug: string; label: string }[],
): string | null {
  if (!slug) return null;
  return options.find((item) => item.slug === slug)?.label ?? null;
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="filter-disclosure-chevron"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArticleListControls({
  q,
  channel,
  category,
  genre,
  window,
  sort,
  categories,
  genres,
}: Props) {
  const categorySummary =
    selectedLabel(category, categories) ??
    selectedLabel(category, ARTICLE_CATEGORIES);
  const genreSummary =
    selectedLabel(genre, genres) ?? selectedLabel(genre, ARTICLE_GENRES);
  const refineSummary = [categorySummary, genreSummary].filter(Boolean).join(" / ");
  const listHref = (extra: {
    category?: string;
    genre?: string;
    window?: ListWindow;
    channel?: ArticleChannel;
    sort?: XListSort;
  }) => {
    const nextChannel = extra.channel ?? channel;
    return buildListHref({
      q,
      channel: nextChannel,
      category: extra.category,
      genre: extra.genre,
      window: extra.window ?? window,
      sort: nextChannel === "x" ? (extra.sort ?? sort) : undefined,
    });
  };

  return (
    <section className="filter-panel animate-rise mb-6" aria-labelledby="filter-panel-title">
      <h2 id="filter-panel-title" className="ui-section-label">
        表示で絞り込み
      </h2>

      <div className="filter-panel-block">
        <p id="filter-channel-label" className="ui-section-label mb-2">
          チャネル
        </p>
        <div
          className="ui-segmented"
          role="group"
          aria-labelledby="filter-channel-label"
        >
          {ARTICLE_CHANNELS.map((item) => {
            const active = channel === item.slug;
            return (
              <Link
                key={item.slug}
                href={listHref({
                  category: category || undefined,
                  genre: genre || undefined,
                  channel: item.slug,
                })}
                aria-current={active ? "true" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="filter-panel-block">
        <p id="filter-period-label" className="ui-section-label mb-2">
          期間
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="filter-period-label"
        >
          {LIST_WINDOWS.map((item) => (
            <FilterChip
              key={item.slug}
              href={listHref({
                category: category || undefined,
                genre: genre || undefined,
                window: item.slug,
              })}
              active={window === item.slug}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {channel === "x" ? (
        <div className="filter-panel-block">
          <p id="filter-sort-label" className="ui-section-label mb-2">
            並び
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-labelledby="filter-sort-label"
          >
            {X_LIST_SORTS.map((item) => (
              <FilterChip
                key={item.slug}
                href={listHref({
                  category: category || undefined,
                  genre: genre || undefined,
                  sort: item.slug,
                })}
                active={sort === item.slug}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      <details
        className="filter-disclosure"
        {...(category || genre ? { open: true } : {})}
      >
        <summary>
          <span className="ui-section-label">絞り込み</span>
          <span
            className={
              refineSummary ? "filter-disclosure-value" : "filter-disclosure-hint"
            }
          >
            {refineSummary || "種別・ソース"}
          </span>
          <ChevronIcon />
        </summary>
        <div className="filter-disclosure-body">
          <p id="filter-type-label" className="ui-section-label mb-2">
            種別で絞り込み
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-labelledby="filter-type-label"
          >
            <FilterChip href={listHref({ window })} active={!category && !genre}>
              すべて
            </FilterChip>
            {categories.map((item) => (
              <FilterChip
                key={item.slug}
                href={listHref({ category: item.slug, window })}
                active={category === item.slug && !genre}
                title={item.hint}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>

          {genres.length > 0 ? (
            <>
              <p id="filter-source-label" className="ui-section-label mt-4 mb-2">
                ソースで絞り込み
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-labelledby="filter-source-label"
              >
                <FilterChip
                  href={listHref({ category: category || undefined, window })}
                  active={!genre}
                >
                  すべて
                </FilterChip>
                {genres.map((item) => (
                  <FilterChip
                    key={item.slug}
                    href={listHref({
                      category: category || undefined,
                      genre: item.slug,
                      window,
                    })}
                    active={genre === item.slug}
                  >
                    {item.label}
                  </FilterChip>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </details>

      <form action="/" method="get" className="filter-search">
        {channel !== DEFAULT_ARTICLE_CHANNEL ? (
          <input type="hidden" name="channel" value={channel} />
        ) : null}
        {category ? (
          <input type="hidden" name="category" value={category} />
        ) : null}
        {genre ? <input type="hidden" name="genre" value={genre} /> : null}
        {window !== DEFAULT_LIST_WINDOW ? (
          <input type="hidden" name="window" value={window} />
        ) : null}
        {channel === "x" && sort !== "latest" ? (
          <input type="hidden" name="sort" value={sort} />
        ) : null}
        <SearchField
          id="article-search"
          name="q"
          defaultValue={q}
          placeholder="タイトル・本文から検索…"
          label="記事を検索"
          className="is-compact"
        />
        <button type="submit" className="filter-search-submit">
          検索
        </button>
      </form>
    </section>
  );
}
