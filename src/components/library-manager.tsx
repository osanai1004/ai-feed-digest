"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { WatchKeywordEditor } from "@/components/watch-keyword-editor";
import { Card } from "@/components/ui/card";
import { SourceBadge } from "@/components/ui/source-badge";
import { formatDate } from "@/lib/formatDate";
import {
  countEntries,
  savedEntries,
  type LibraryArticleRef,
  type LibraryEntry,
} from "@/lib/library";
import {
  exportLibraryJson,
  libraryActions,
  useLibrary,
} from "@/lib/libraryStore";
import { safeExternalUrl } from "@/lib/safeUrl";

function toRef(entry: LibraryEntry): LibraryArticleRef {
  return {
    id: entry.articleId,
    url: entry.sourceUrl,
    title: entry.title,
    source: entry.source,
    publishedAt: entry.publishedAt,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function LibraryManager() {
  const { ready, data } = useLibrary();
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => countEntries(data), [data]);
  const saved = useMemo(() => savedEntries(data), [data]);
  const usageBytes = useMemo(
    () => new Blob([JSON.stringify(data)]).size,
    [data],
  );

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const blob = new Blob([exportLibraryJson()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `yoyaku-wakaru-backup-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setImportResult(libraryActions.importLibrary(text));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClearAll() {
    const confirmed = window.confirm(
      "この端末に記録した保存・既読・ウォッチキーワードをすべて削除します。元に戻せません。よろしいですか？",
    );
    if (confirmed) {
      libraryActions.clearAll();
      setImportResult(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Card soft className="animate-rise p-5 sm:p-6">
        <h2 className="font-display text-[18px] font-bold">
          保存先：このブラウザ
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--body)]">
          保存・既読・ウォッチキーワードは、この端末のこのブラウザにのみ記録されます。ログイン同期はありません。次の場合に消えることがあります。
        </p>
        <ul className="mt-3 grid gap-1.5 text-[13px] leading-6 text-[var(--body)]">
          <li>・ブラウザの閲覧データ（サイトデータ）を削除した場合</li>
          <li>・シークレットモード（終了時にデータを破棄する閲覧モード）を終了した場合</li>
          <li>・別の端末・別のブラウザ・別のプロファイルで開いた場合</li>
          <li>・サイトのドメイン（URLの前半部分）が変わった場合</li>
        </ul>
        <p className="mt-3 text-[13px] leading-6 text-[var(--body)]">
          重要な記事は原文URLのブックマークを併用し、定期的に下のエクスポートでバックアップ（復元用の控え）を取ることをおすすめします。
        </p>
      </Card>

      <Card className="animate-rise p-5 sm:p-6">
        <h2 className="font-display text-[18px] font-bold">保存データの管理</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-3">
            <dt className="text-[11px] font-extrabold text-[var(--mute)]">
              あとで読む
            </dt>
            <dd className="mt-1 text-[20px] font-bold">
              {ready ? counts.saved : "–"}
              <span className="ml-0.5 text-[12px] font-semibold">件</span>
            </dd>
          </div>
          <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-3">
            <dt className="text-[11px] font-extrabold text-[var(--mute)]">
              既読
            </dt>
            <dd className="mt-1 text-[20px] font-bold">
              {ready ? counts.read : "–"}
              <span className="ml-0.5 text-[12px] font-semibold">件</span>
            </dd>
          </div>
          <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-3">
            <dt className="text-[11px] font-extrabold text-[var(--mute)]">
              使用容量
            </dt>
            <dd className="mt-1 text-[20px] font-bold">
              {ready ? formatBytes(usageBytes) : "–"}
            </dd>
          </div>
          <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-3">
            <dt className="text-[11px] font-extrabold text-[var(--mute)]">
              最終更新
            </dt>
            <dd className="mt-1 text-[13px] leading-6 font-bold">
              {ready && data.updatedAt
                ? formatDate(data.updatedAt, "long")
                : "–"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleExport} className="ui-action-btn">
            JSONでエクスポート
          </button>
          <label className="ui-action-btn cursor-pointer">
            JSONをインポート
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => handleImportFile(event.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            onClick={handleClearAll}
            className="ui-action-btn text-[var(--chip-orange-fg)]"
          >
            すべて削除
          </button>
        </div>

        {importResult ? (
          <p
            role="status"
            className={`mt-3 text-[12px] font-bold ${importResult.ok ? "text-[var(--chip-teal-fg)]" : "text-[var(--chip-orange-fg)]"}`}
          >
            {importResult.message}
          </p>
        ) : null}
      </Card>

      <Card className="animate-rise p-5 sm:p-6">
        <h2 className="font-display text-[18px] font-bold">
          ウォッチキーワード
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--body)]">
          気になる語を登録すると、一覧で一致した記事に印が付き、絞り込みができます。
        </p>
        <div className="mt-4">
          <WatchKeywordEditor keywords={data.watchKeywords} />
        </div>
      </Card>

      <section aria-labelledby="saved-articles-heading">
        <h2
          id="saved-articles-heading"
          className="font-display text-[20px] font-bold tracking-[-0.02em]"
        >
          あとで読む（{ready ? saved.length : "–"}件）
        </h2>
        <div className="mt-4 grid gap-3">
          {ready && saved.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-display text-[18px] font-bold">
                まだ保存した記事がありません
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
                一覧の記事カードにある「あとで読む」ボタンで保存できます。
              </p>
              <Link href="/" className="cta-button mt-5">
                記事一覧を見る →
              </Link>
            </Card>
          ) : (
            saved.map((entry) => {
              const externalUrl = safeExternalUrl(entry.sourceUrl);
              return (
                <Card key={entry.articleId} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SourceBadge source={entry.source} />
                    <p className="text-[11px] font-semibold text-[var(--mute)]">
                      保存:{" "}
                      {entry.savedAt ? formatDate(entry.savedAt, "long") : "–"}
                    </p>
                  </div>
                  <h3 className="mt-2 text-[16px] leading-6 font-bold">
                    <Link
                      href={`/articles/${entry.articleId}`}
                      className="transition hover:text-[var(--accent-strong)]"
                    >
                      {entry.title}
                    </Link>
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {externalUrl ? (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-action-btn"
                      >
                        原文を開く ↗
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        libraryActions.toggleSaved(
                          toRef(entry),
                          entry.summaryHash ?? "",
                        )
                      }
                      className="ui-action-btn"
                    >
                      保存を解除
                    </button>
                    <span className="text-[11px] font-semibold text-[var(--mute)]">
                      {entry.readAt ? "既読" : "未読"}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        {ready && saved.length > 0 ? (
          <p className="mt-3 text-[11px] leading-5 text-[var(--mute)]">
            記事が配信元の都合で削除された場合も、この一覧の「原文を開く」から元のページへアクセスできます。
          </p>
        ) : null}
      </section>
    </div>
  );
}
