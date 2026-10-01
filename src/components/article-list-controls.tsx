import Link from "next/link";
import type { ReactNode } from "react";
import { SearchField } from "@/components/ui/search-field";
import { buildListHref } from "@/lib/articleFilters";
import {
  ARTICLE_CHANNELS,
  DEFAULT_ARTICLE_CHANNEL,
  DEFAULT_LIST_WINDOW,
  LIST_WINDOWS,
  type ArticleChannel,
  type CategorySlug,
  type GenreSlug,
  type ListWindow,
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
  categories: CategoryOption[];
  genres: GenreOption[];
  resultCount: number;
  totalCount: number;
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
      className={`ui-chip whitespace-nowrap transition${active ? " ui-chip-brand" : " ui-chip-soft"}`}
    >
      {children}
    </Link>
  );
}

export function ArticleListControls({
  q,
  channel,
  category,
  genre,
  window,
  categories,
  genres,
  resultCount,
  totalCount,
}: Props) {
  const hasFilter = Boolean(q || category || genre);
  const windowLabel =
    LIST_WINDOWS.find((item) => item.slug === window)?.label ?? "直近24時間";
  const channelLabel =
    ARTICLE_CHANNELS.find((item) => item.slug === channel)?.label ?? "All";
  const scopeLabel =
    channel === DEFAULT_ARTICLE_CHANNEL
      ? windowLabel
      : window === "all"
        ? channelLabel
        : `${channelLabel}・${windowLabel}`;
  const listHref = (extra: {
    category?: string;
    genre?: string;
    window?: ListWindow;
    channel?: ArticleChannel;
  }) =>
    buildListHref({
      q,
      channel: extra.channel ?? channel,
      category: extra.category,
      genre: extra.genre,
      window: extra.window ?? window,
    });

  return (
    <section className="animate-rise mb-6 border-y border-[var(--hairline)] py-5">
      <form action="/" method="get" className="flex flex-col gap-3 sm:flex-row">
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
        <SearchField
          id="article-search"
          name="q"
          defaultValue={q}
          placeholder="タイトル・本文から検索…"
          label="記事を検索"
        />
        <button
          type="submit"
          className="shrink-0 rounded-2xl bg-[var(--accent)] px-5 py-3 text-[13px] font-extrabold text-white shadow-sm transition hover:brightness-105"
        >
          検索
        </button>
      </form>

      <div className="mt-5">
        <p className="ui-section-label mb-2">チャネル</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="チャネル">
          {ARTICLE_CHANNELS.map((item) => (
            <FilterChip
              key={item.slug}
              href={listHref({
                category: category || undefined,
                genre: genre || undefined,
                channel: item.slug,
              })}
              active={channel === item.slug}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="ui-section-label mb-2">期間</p>
        <div className="flex flex-wrap gap-2">
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

      <div className="mt-5">
        <p className="ui-section-label mb-2">種別で絞り込み</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            href={listHref({ window })}
            active={!category && !genre}
          >
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
      </div>

      {genres.length > 0 ? (
        <div className="mt-4">
          <p className="ui-section-label mb-2">ソースで絞り込み</p>
          <div className="flex flex-wrap gap-2">
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
        </div>
      ) : null}

      <p className="mt-4 min-w-0 break-words text-[12px] font-semibold text-[var(--body)]">
        {window === "all" && channel === DEFAULT_ARTICLE_CHANNEL
          ? hasFilter
            ? `${totalCount}件中 ${resultCount}件を表示`
            : `${resultCount}件の要約`
          : hasFilter
            ? `${scopeLabel}の ${totalCount}件中 ${resultCount}件を表示`
            : `${scopeLabel}の ${resultCount}件`}
        {q ? (
          <span className="break-all text-[var(--mute)]">
            {" "}
            / 「{q}」
          </span>
        ) : null}
      </p>
    </section>
  );
}
