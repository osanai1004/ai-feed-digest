"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { SourceBadge, sourceToneVars } from "@/components/ui/source-badge";
import { formatDate } from "@/lib/formatDate";
import { toSingleLine } from "@/lib/text";
import type { Article } from "@/lib/types";

type Props = {
  article: Article;
  index: number;
  saved: boolean;
  read: boolean;
  /** 一致したウォッチキーワード（なければ null） */
  watchedKeyword: string | null;
  onToggleSaved: () => void;
  onToggleRead: () => void;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ArticleCard({
  article,
  index,
  saved,
  read,
  watchedKeyword,
  onToggleSaved,
  onToggleRead,
}: Props) {
  return (
    <article
      className={`ui-card animate-rise group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] sm:p-6${read ? " opacity-75" : ""}`}
      style={{
        ...sourceToneVars(article.source),
        animationDelay: `${Math.min(index, 6) * 60}ms`,
      }}
    >
      <div className="ui-source-bar absolute inset-y-0 left-0 w-1.5" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={article.source} />
          {watchedKeyword ? (
            <Chip tone="orange">ウォッチ: {watchedKeyword}</Chip>
          ) : null}
          {read ? <Chip tone="soft">既読</Chip> : null}
        </div>
        <time
          dateTime={article.publishedAt}
          className="text-[12px] font-semibold text-[var(--mute)]"
        >
          {formatDate(article.publishedAt, "short")}
        </time>
      </div>
      <h2 className="font-display pl-2 text-[22px] leading-snug font-bold tracking-[-0.02em] sm:text-[24px]">
        <Link
          href={`/articles/${article.id}`}
          className="outline-none transition group-hover:text-[var(--accent-strong)] after:absolute after:inset-0 after:content-[''] focus-visible:text-[var(--accent-strong)]"
        >
          {article.title}
        </Link>
      </h2>
      <p className="mt-3 line-clamp-2 pl-2 text-[14px] leading-6 text-[var(--body)]">
        {toSingleLine(article.summary.general.conclusion)}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pl-2">
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={saved}
            onClick={onToggleSaved}
            className={`ui-action-btn${saved ? " is-active" : ""}`}
          >
            <BookmarkIcon filled={saved} />
            {saved ? "保存済み" : "あとで読む"}
          </button>
          <button
            type="button"
            aria-pressed={read}
            onClick={onToggleRead}
            className={`ui-action-btn${read ? " is-active" : ""}`}
          >
            <CheckIcon />
            {read ? "未読に戻す" : "既読にする"}
          </button>
        </div>
        <span className="text-[12px] font-bold text-[var(--accent)]">
          要約を読む{" "}
          <span className="inline-block transition group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </article>
  );
}
