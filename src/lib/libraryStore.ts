"use client";

import { useEffect, useSyncExternalStore } from "react";
import { LIBRARY_STORAGE_KEY, WATCH_KEYWORDS_MAX } from "./constants";
import {
  createEmptyLibrary,
  EMPTY_LIBRARY,
  mergeLibraries,
  normalizeWatchKeyword,
  parseLibraryData,
  pruneLibrary,
  serializeLibrary,
  type LibraryArticleRef,
  type LibraryData,
  type LibraryEntry,
} from "./library";

/**
 * 端末内ライブラリの localStorage 同期ストア。
 * - 初回描画はサーバーと同じ空状態にし、マウント後に load() で実データを反映する
 *   （ハイドレーション不一致＝サーバーとクライアントの初期描画のズレを防ぐ）。
 * - 別タブでの変更は storage イベントで反映する。
 */

export type LibrarySnapshot = {
  /** localStorage の読み込みが完了したか（完了前は空データ） */
  ready: boolean;
  data: LibraryData;
};

const SERVER_SNAPSHOT: LibrarySnapshot = Object.freeze({
  ready: false,
  data: EMPTY_LIBRARY,
});

let snapshot: LibrarySnapshot = SERVER_SNAPSHOT;
let storageListenerAttached = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function readFromStorage(): LibraryData {
  try {
    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) return createEmptyLibrary();
    return parseLibraryData(JSON.parse(raw)) ?? createEmptyLibrary();
  } catch {
    // localStorage が使えない環境・壊れたデータは空扱い
    return createEmptyLibrary();
  }
}

function writeToStorage(data: LibraryData): boolean {
  try {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // 容量超過などで書けなくても画面上の状態は維持する
    return false;
  }
}

function setData(data: LibraryData) {
  snapshot = { ready: true, data };
  writeToStorage(data);
  notify();
}

function load() {
  if (snapshot.ready) return;
  snapshot = { ready: true, data: readFromStorage() };
  if (!storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== LIBRARY_STORAGE_KEY) return;
      snapshot = { ready: true, data: readFromStorage() };
      notify();
    });
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): LibrarySnapshot {
  return snapshot;
}

function getServerSnapshot(): LibrarySnapshot {
  return SERVER_SNAPSHOT;
}

function touch(data: LibraryData): LibraryData {
  return { ...data, updatedAt: new Date().toISOString() };
}

function upsertEntry(
  data: LibraryData,
  article: LibraryArticleRef,
  patch: Partial<Pick<LibraryEntry, "savedAt" | "readAt" | "summaryHash">>,
): LibraryData {
  const now = new Date().toISOString();
  const existing = data.entries[article.id];
  const next: LibraryEntry = {
    articleId: article.id,
    sourceUrl: article.url,
    title: article.title,
    source: article.source,
    publishedAt: article.publishedAt,
    savedAt: existing?.savedAt ?? null,
    readAt: existing?.readAt ?? null,
    summaryHash: existing?.summaryHash ?? null,
    ...patch,
    updatedAt: now,
  };

  const entries = { ...data.entries };
  if (!next.savedAt && !next.readAt) {
    // 保存も既読もなくなったエントリは削除して容量を節約する
    delete entries[article.id];
  } else {
    entries[article.id] = next;
  }
  return pruneLibrary(touch({ ...data, entries }));
}

export const libraryActions = {
  /** 「あとで読む」のオン・オフを切り替える */
  toggleSaved(article: LibraryArticleRef, currentSummaryHash: string) {
    const saved = Boolean(snapshot.data.entries[article.id]?.savedAt);
    const now = new Date().toISOString();
    setData(
      upsertEntry(snapshot.data, article, {
        savedAt: saved ? null : now,
        // 保存時点の要約を覚えて、後で更新を検知できるようにする
        summaryHash: saved
          ? snapshot.data.entries[article.id]?.summaryHash ?? null
          : currentSummaryHash,
      }),
    );
  },

  /** 既読・未読を明示的に切り替える */
  setRead(article: LibraryArticleRef, read: boolean) {
    setData(
      upsertEntry(snapshot.data, article, {
        readAt: read ? new Date().toISOString() : null,
      }),
    );
  },

  /** 詳細ページを開いたときの自動既読（すでに既読なら何もしない） */
  markVisited(article: LibraryArticleRef) {
    if (!snapshot.ready) load();
    if (snapshot.data.entries[article.id]?.readAt) return;
    setData(
      upsertEntry(snapshot.data, article, {
        readAt: new Date().toISOString(),
      }),
    );
  },

  /** 「要約が更新されました」表示を、現在の内容で了解済みにする */
  refreshSummaryHash(article: LibraryArticleRef, currentSummaryHash: string) {
    if (!snapshot.data.entries[article.id]) return;
    setData(
      upsertEntry(snapshot.data, article, { summaryHash: currentSummaryHash }),
    );
  },

  /** 端末内保存の説明を確認済みにする */
  acknowledgeNotice() {
    if (snapshot.data.noticeAcknowledged) return;
    setData(touch({ ...snapshot.data, noticeAcknowledged: true }));
  },

  /** ウォッチキーワードを追加する。追加できなかった理由を返す */
  addWatchKeyword(raw: string): string | null {
    const keyword = normalizeWatchKeyword(raw);
    if (!keyword) return "キーワードを入力してください。";
    const exists = snapshot.data.watchKeywords.some(
      (k) => k.toLowerCase() === keyword.toLowerCase(),
    );
    if (exists) return "同じキーワードが登録済みです。";
    if (snapshot.data.watchKeywords.length >= WATCH_KEYWORDS_MAX) {
      return `登録できるのは${WATCH_KEYWORDS_MAX}件までです。`;
    }
    setData(
      touch({
        ...snapshot.data,
        watchKeywords: [...snapshot.data.watchKeywords, keyword],
      }),
    );
    return null;
  },

  removeWatchKeyword(keyword: string) {
    setData(
      touch({
        ...snapshot.data,
        watchKeywords: snapshot.data.watchKeywords.filter(
          (k) => k !== keyword,
        ),
      }),
    );
  },

  /** JSONバックアップを取り込む（既存データと統合） */
  importLibrary(rawJson: string): { ok: boolean; message: string } {
    let parsed: LibraryData | null = null;
    try {
      parsed = parseLibraryData(JSON.parse(rawJson));
    } catch {
      parsed = null;
    }
    if (!parsed) {
      return {
        ok: false,
        message:
          "読み込めませんでした。このアプリでエクスポートしたJSONファイルを選んでください。",
      };
    }
    const importedCount = Object.keys(parsed.entries).length;
    setData(mergeLibraries(snapshot.data, parsed));
    return {
      ok: true,
      message: `${importedCount}件の記事データを取り込みました（既存データと統合済み）。`,
    };
  },

  /** 端末内の保存データをすべて削除する */
  clearAll() {
    setData(touch(createEmptyLibrary()));
  },
};

export function exportLibraryJson(): string {
  return serializeLibrary(snapshot.data);
}

/** 端末内ライブラリを購読するフック */
export function useLibrary(): LibrarySnapshot {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    load();
  }, []);
  return value;
}
