"use client";

import Link from "next/link";
import { ArticlePublishMeta, XEngagementMeta } from "@/components/x-engagement-meta";
import { Chip } from "@/components/ui/chip";
import { SourceBadge, sourceToneVars, XSignalBadge } from "@/components/ui/source-badge";
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
      className={`ui-article-row animate-rise group overflow-hidden p-5 sm:p-6${read ? " opacity-70" : ""}`}
      style={{
        ...sourceToneVars(article.source),
        animationDelay: `${Math.min(index, 6) * 55}ms`,
      }}
    >
      <div className="ui-source-bar absolute inset-y-0 left-0 w-1" />
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2 pl-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SourceBadge source={article.source} />
          {article.origin === "x" && article.source.trim().toLowerCase() !== "x" ? (
            <XSignalBadge />
          ) : null}
          {article.origin === "x" && article.officialNote ? (
            <Chip tone="teal" title={article.officialNote}>
              公式確認
            </Chip>
          ) : null}
          {article.origin === "x" && !article.officialNote ? (
            <Chip tone="sky" title="公式ページはなく、Xの投稿本文から要約しています">
              投稿から要約
            </Chip>
          ) : null}
          {watchedKeyword ? (
            <Chip
              tone="orange"
              className="max-w-full truncate"
              title={`ウォッチ: ${watchedKeyword}`}
            >
              ウォッチ: {watchedKeyword}
            </Chip>
          ) : null}
          {read ? <Chip tone="soft">既読</Chip> : null}
        </div>
        <ArticlePublishMeta article={article} dateStyle="short" />
      </div>
      <h2 className="font-display min-w-0 break-words pl-2.5 text-[21px] leading-snug font-bold tracking-[-0.025em] sm:text-[24px]">
        <Link
          href={`/articles/${article.id}`}
          className="outline-none transition group-hover:text-[var(--accent-strong)] after:absolute after:inset-0 after:content-[''] focus-visible:text-[var(--accent-strong)]"
        >
          {article.title}
        </Link>
      </h2>
      <p className="mt-3 line-clamp-2 break-words pl-2.5 text-[14px] leading-7 text-[var(--body)]">
        {toSingleLine(article.summary.general.conclusion)}
      </p>
      <XEngagementMeta article={article} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pl-2.5">
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
