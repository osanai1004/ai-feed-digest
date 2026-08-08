"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { ArticlePagination } from "@/components/article-pagination";
import { EmptyArticles } from "@/components/empty-articles";
import { LocalSaveNotice } from "@/components/local-save-notice";
import { WatchKeywordEditor } from "@/components/watch-keyword-editor";
import { Card } from "@/components/ui/card";
import {
  articleSearchText,
  paginateArticles,
  type ArticleListQuery,
} from "@/lib/articleFilters";
import {
  LIBRARY_FILTER_PAGE_SIZE,
  LIBRARY_STATUS_FILTERS,
  type LibraryStatusFilterSlug,
} from "@/lib/constants";
import {
  isRead,
  isSaved,
  matchedWatchKeyword,
  type LibraryArticleRef,
} from "@/lib/library";
import { libraryActions, useLibrary } from "@/lib/libraryStore";
import { summaryHash } from "@/lib/summaryHash";
import type { Article } from "@/lib/types";

type Props = {
  /** URLの検索・種別・ソース条件で絞り込み済みの記事（全ページ分） */
  articles: Article[];
  query: ArticleListQuery;
};

function toRef(article: Article): LibraryArticleRef {
  return {
    id: article.id,
    url: article.url,
    title: article.title,
    source: article.source,
    publishedAt: article.publishedAt,
  };
}

const EMPTY_STATUS_MESSAGES: Record<
  Exclude<LibraryStatusFilterSlug, "all">,
  { title: string; body: string }
> = {
  unread: {
    title: "未読の記事はありません",
    body: "この条件の記事はすべて既読です。おつかれさまでした。",
  },
  saved: {
    title: "「あとで読む」に保存した記事はありません",
    body: "記事カードの「あとで読む」ボタンで、この端末に保存できます。",
  },
  watched: {
    title: "ウォッチに一致する記事はありません",
    body: "下の「ウォッチキーワード」から気になる語を登録すると、一致した記事をここで絞り込めます。",
  },
};

export function ArticleListView({ articles, query }: Props) {
  const { ready, data } = useLibrary();
  const [status, setStatus] = useState<LibraryStatusFilterSlug>("all");
  const [visibleCount, setVisibleCount] = useState(LIBRARY_FILTER_PAGE_SIZE);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const watchedKeywordByArticle = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const article of articles) {
      map.set(
        article.id,
        data.watchKeywords.length > 0
          ? matchedWatchKeyword(articleSearchText(article), data.watchKeywords)
          : null,
      );
    }
    return map;
  }, [articles, data.watchKeywords]);

  const statusCounts = useMemo(() => {
    let unread = 0;
    let saved = 0;
    let watched = 0;
    for (const article of articles) {
      if (!isRead(data, article.id)) unread += 1;
      if (isSaved(data, article.id)) saved += 1;
      if (watchedKeywordByArticle.get(article.id)) watched += 1;
    }
    return { all: articles.length, unread, saved, watched };
  }, [articles, data, watchedKeywordByArticle]);

  const statusFiltered = useMemo(() => {
    switch (status) {
      case "unread":
        return articles.filter((article) => !isRead(data, article.id));
      case "saved":
        return articles.filter((article) => isSaved(data, article.id));
      case "watched":
        return articles.filter((article) =>
          Boolean(watchedKeywordByArticle.get(article.id)),
        );
      default:
        return articles;
    }
  }, [articles, data, status, watchedKeywordByArticle]);

  // 「すべて」はURLのページ番号どおり（共有可能なリンクを維持）、
  // 端末内状態での絞り込み中は「もっと見る」方式で表示する
  const pageResult =
    status === "all" ? paginateArticles(articles, query.page) : null;
  const visibleItems = pageResult
    ? pageResult.items
    : statusFiltered.slice(0, visibleCount);

  function changeStatus(next: LibraryStatusFilterSlug) {
    setStatus(next);
    setVisibleCount(LIBRARY_FILTER_PAGE_SIZE);
  }

  function handleToggleSaved(article: Article) {
    if (!isSaved(data, article.id) && !data.noticeAcknowledged) {
      setNoticeOpen(true);
    }
    libraryActions.toggleSaved(toRef(article), summaryHash(article.summary));
  }

  function handleToggleRead(article: Article) {
    libraryActions.setRead(toRef(article), !isRead(data, article.id));
  }

  function closeNotice() {
    libraryActions.acknowledgeNotice();
    setNoticeOpen(false);
  }

  const activeFilter = LIBRARY_STATUS_FILTERS.find((f) => f.slug === status);

  return (
    <>
      <Card soft className="animate-rise mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-[11px] leading-snug font-extrabold tracking-[0.08em] text-[var(--mute)] uppercase sm:tracking-[0.12em]">
            表示で絞り込み（この端末の記録）
          </p>
          {ready ? (
            <p className="text-[12px] font-bold text-[var(--chip-teal-fg)]">
              未読 {statusCounts.unread}件
            </p>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="表示で絞り込み">
          {LIBRARY_STATUS_FILTERS.map((filter) => {
            const active = status === filter.slug;
            return (
              <button
                key={filter.slug}
                type="button"
                aria-pressed={active}
                onClick={() => changeStatus(filter.slug)}
                className={`ui-chip cursor-pointer transition${active ? " ui-chip-brand" : " ui-chip-soft"}`}
              >
                {filter.label}
                {ready && filter.slug !== "all"
                  ? ` (${statusCounts[filter.slug]})`
                  : ""}
              </button>
            );
          })}
        </div>

        {status !== "all" && activeFilter ? (
          <p className="mt-3 text-[12px] font-semibold text-[var(--body)]">
            「{activeFilter.label}」{statusFiltered.length}件を表示中
            <button
              type="button"
              onClick={() => changeStatus("all")}
              className="ml-2 font-bold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              すべてに戻す
            </button>
          </p>
        ) : null}

        <details className="mt-4 border-t border-[var(--hairline)] pt-3">
          <summary className="cursor-pointer text-[12px] font-extrabold text-[var(--ink-soft)]">
            ウォッチキーワード
            {data.watchKeywords.length > 0
              ? `（${data.watchKeywords.length}件）`
              : ""}
          </summary>
          <div className="mt-3">
            <WatchKeywordEditor keywords={data.watchKeywords} />
          </div>
        </details>

        <p className="mt-3 border-t border-[var(--hairline)] pt-3 text-[11px] leading-5 text-[var(--mute)]">
          保存・既読・ウォッチはこの端末のブラウザにのみ記録されます（ログイン同期なし）。
          <Link
            href="/library"
            className="ml-1 font-bold text-[var(--accent)] underline-offset-4 hover:underline"
          >
            保存データの管理 →
          </Link>
        </p>
      </Card>

      <section className="grid gap-4">
        {visibleItems.length === 0 ? (
          status === "all" ? (
            <EmptyArticles />
          ) : (
            <Card className="p-8 text-center">
              <p className="font-display text-[18px] font-bold">
                {EMPTY_STATUS_MESSAGES[status].title}
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
                {EMPTY_STATUS_MESSAGES[status].body}
              </p>
              <button
                type="button"
                onClick={() => changeStatus("all")}
                className="ui-action-btn mt-5"
              >
                すべての記事に戻る
              </button>
            </Card>
          )
        ) : (
          visibleItems.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              index={index}
              saved={isSaved(data, article.id)}
              read={isRead(data, article.id)}
              watchedKeyword={watchedKeywordByArticle.get(article.id) ?? null}
              onToggleSaved={() => handleToggleSaved(article)}
              onToggleRead={() => handleToggleRead(article)}
            />
          ))
        )}
      </section>

      {pageResult ? (
        <ArticlePagination
          q={query.q}
          category={query.category}
          genre={query.genre}
          page={pageResult.page}
          totalPages={pageResult.totalPages}
          total={pageResult.total}
        />
      ) : statusFiltered.length > visibleCount ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) => count + LIBRARY_FILTER_PAGE_SIZE)
            }
            className="ui-action-btn"
          >
            もっと見る（残り{statusFiltered.length - visibleCount}件）
          </button>
        </div>
      ) : null}

      <LocalSaveNotice open={noticeOpen} onClose={closeNotice} />
    </>
  );
}
