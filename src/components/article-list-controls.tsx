"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
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
  resultCount: number;
  totalCount: number;
};

/** 同時に開けるフィルター区画は1つまで。初期はすべて閉じる */
type FilterSectionId = "channel" | "period" | "type" | "source";

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
      className="filter-accordion-chevron"
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

function FilterSection({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: FilterSectionId;
  title: string;
  summary: string | null;
  open: boolean;
  onToggle: (id: FilterSectionId) => void;
  children: ReactNode;
}) {
  const triggerId = `filter-section-${id}-trigger`;
  const panelId = `filter-section-${id}-panel`;

  return (
    <div className="filter-accordion-section">
      <button
        type="button"
        id={triggerId}
        className="filter-accordion-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
      >
        <span className="ui-section-label">{title}</span>
        {summary ? (
          <span className="filter-accordion-summary">{summary}</span>
        ) : null}
        <ChevronIcon />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="filter-accordion-panel"
        data-open={open ? "true" : "false"}
        inert={!open}
        aria-hidden={open ? undefined : true}
      >
        <div className="filter-accordion-panel-inner">
          <div className="filter-accordion-panel-body">{children}</div>
        </div>
      </div>
    </div>
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
  resultCount,
  totalCount,
}: Props) {
  const [openSection, setOpenSection] = useState<FilterSectionId | null>(null);
  const hasFilter = Boolean(q || category || genre);
  const windowLabel =
    LIST_WINDOWS.find((item) => item.slug === window)?.label ?? "直近24時間";
  const channelLabel =
    ARTICLE_CHANNELS.find((item) => item.slug === channel)?.label ?? "All";
  const channelSummary =
    channel === DEFAULT_ARTICLE_CHANNEL ? null : channelLabel;
  const periodSummary = window === "all" ? null : windowLabel;
  const categorySummary =
    selectedLabel(category, categories) ??
    selectedLabel(category, ARTICLE_CATEGORIES);
  const genreSummary =
    selectedLabel(genre, genres) ?? selectedLabel(genre, ARTICLE_GENRES);
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

  function toggleSection(id: FilterSectionId) {
    setOpenSection((current) => (current === id ? null : id));
  }

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
        {channel === "x" && sort !== "latest" ? (
          <input type="hidden" name="sort" value={sort} />
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

      <div className="filter-accordion">
        <FilterSection
          id="channel"
          title="チャネル"
          summary={channelSummary}
          open={openSection === "channel"}
          onToggle={toggleSection}
        >
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
        </FilterSection>

        {channel === "x" ? (
          <div className="filter-sort-row">
            <p className="ui-section-label mb-2">並び</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Xの並び">
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

        <FilterSection
          id="period"
          title="期間"
          summary={periodSummary}
          open={openSection === "period"}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="期間">
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
        </FilterSection>

        <FilterSection
          id="type"
          title="種別で絞り込み"
          summary={categorySummary}
          open={openSection === "type"}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="種別で絞り込み">
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
        </FilterSection>

        {genres.length > 0 ? (
          <FilterSection
            id="source"
            title="ソースで絞り込み"
            summary={genreSummary}
            open={openSection === "source"}
            onToggle={toggleSection}
          >
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="ソースで絞り込み"
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
          </FilterSection>
        ) : null}
      </div>

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
