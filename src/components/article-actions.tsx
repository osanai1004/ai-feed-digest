"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LocalSaveNotice } from "@/components/local-save-notice";
import {
  AUDIENCE_VOICE_STORAGE_KEY,
  DEFAULT_AUDIENCE_VOICE,
} from "@/lib/constants";
import { type LibraryArticleRef } from "@/lib/library";
import { libraryActions, useLibrary } from "@/lib/libraryStore";
import { articleToMarkdown, articleToSlackText } from "@/lib/markdown";
import { summaryHash } from "@/lib/summaryHash";
import type { Article, AudienceVoice } from "@/lib/types";

type Props = {
  article: Article;
};

type CopyTarget = "markdown" | "slack";

function toRef(article: Article): LibraryArticleRef {
  return {
    id: article.id,
    url: article.url,
    title: article.title,
    source: article.source,
    publishedAt: article.publishedAt,
  };
}

/** コピー時は読者タブの選択（非エンジニア/エンジニア）に合わせる */
function currentVoice(): AudienceVoice {
  try {
    const saved = window.localStorage.getItem(AUDIENCE_VOICE_STORAGE_KEY);
    if (saved === "general" || saved === "engineer") return saved;
  } catch {
    // localStorage が使えない環境では初期値
  }
  return DEFAULT_AUDIENCE_VOICE;
}

export function ArticleActions({ article }: Props) {
  const { ready, data } = useLibrary();
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const currentHash = useMemo(
    () => summaryHash(article.summary),
    [article.summary],
  );

  // 詳細を開いた時点で既読にする（「未読に戻す」でいつでも取り消せる）
  useEffect(() => {
    libraryActions.markVisited(toRef(article));
  }, [article]);

  const entry = data.entries[article.id];
  const saved = Boolean(entry?.savedAt);
  const read = Boolean(entry?.readAt);
  const summaryUpdatedSinceSaved = Boolean(
    saved && entry?.summaryHash && entry.summaryHash !== currentHash,
  );

  function handleToggleSaved() {
    if (!saved && !data.noticeAcknowledged) setNoticeOpen(true);
    libraryActions.toggleSaved(toRef(article), currentHash);
  }

  function handleToggleRead() {
    libraryActions.setRead(toRef(article), !read);
  }

  async function handleCopy(target: CopyTarget) {
    const voice = currentVoice();
    const text =
      target === "markdown"
        ? articleToMarkdown(article, voice)
        : articleToSlackText(article, voice);
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(false);
      setCopied(target);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopyError(true);
    }
  }

  function closeNotice() {
    libraryActions.acknowledgeNotice();
    setNoticeOpen(false);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={saved}
          onClick={handleToggleSaved}
          className={`ui-action-btn${saved ? " is-active" : ""}`}
        >
          {saved ? "保存済み（あとで読む）" : "あとで読むに保存"}
        </button>
        <button
          type="button"
          aria-pressed={read}
          onClick={handleToggleRead}
          className={`ui-action-btn${read ? " is-active" : ""}`}
        >
          {read ? "未読に戻す" : "既読にする"}
        </button>
        <button
          type="button"
          onClick={() => handleCopy("markdown")}
          className="ui-action-btn"
        >
          {copied === "markdown" ? "コピーしました" : "Markdownをコピー"}
        </button>
        <button
          type="button"
          onClick={() => handleCopy("slack")}
          className="ui-action-btn"
        >
          {copied === "slack" ? "コピーしました" : "Slack用にコピー"}
        </button>
      </div>

      {copyError ? (
        <p role="alert" className="mt-2 text-[12px] font-bold text-[var(--chip-orange-fg)]">
          コピーできませんでした。お使いのブラウザの設定をご確認ください。
        </p>
      ) : null}

      <p className="mt-2 text-[11px] leading-5 text-[var(--mute)]">
        保存・既読はこの端末のブラウザにのみ記録されます。コピーには記事の公開情報のみが含まれます。
        <Link
          href="/library"
          className="ml-1 font-bold text-[var(--accent)] underline-offset-4 hover:underline"
        >
          保存データの管理 →
        </Link>
      </p>

      {ready && summaryUpdatedSinceSaved ? (
        <div className="mt-4 rounded-2xl border border-[var(--chip-orange-fg)]/30 bg-[var(--chip-orange-bg)] p-4">
          <p className="text-[13px] leading-6 font-bold text-[var(--chip-orange-fg)]">
            「あとで読む」に保存したときから、要約の内容が更新されています。
          </p>
          <button
            type="button"
            onClick={() =>
              libraryActions.refreshSummaryHash(toRef(article), currentHash)
            }
            className="ui-action-btn mt-2"
          >
            最新の内容を確認しました
          </button>
        </div>
      ) : null}

      <LocalSaveNotice open={noticeOpen} onClose={closeNotice} />
    </div>
  );
}
