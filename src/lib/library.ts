import {
  LIBRARY_DATA_VERSION,
  LIBRARY_MAX_ENTRIES,
  WATCH_KEYWORD_MAX_LENGTH,
  WATCH_KEYWORDS_MAX,
} from "./constants";
import type { Article } from "./types";

/**
 * 端末内ライブラリ（保存・既読・ウォッチキーワード）の型と純粋ロジック。
 * localStorage への読み書きは libraryStore.ts が担当し、
 * このファイルは正規化・検証・整形のみを行う（サーバーでも import 可）。
 */

/** ライブラリ操作に必要な記事の最小情報（記事削除後も一覧表示できるよう複製して保持） */
export type LibraryArticleRef = Pick<
  Article,
  "id" | "url" | "title" | "source" | "publishedAt"
>;

export type LibraryEntry = {
  /** 記事の安定ID（source + URL から生成される値） */
  articleId: string;
  /** 原文URL（記事がサーバー側から消えても原文へ辿れるように保持） */
  sourceUrl: string;
  title: string;
  source: string;
  publishedAt: string;
  /** 「あとで読む」に登録した日時。null なら未登録 */
  savedAt: string | null;
  /** 既読にした日時。null なら未読 */
  readAt: string | null;
  /** 保存時点の要約ハッシュ（要約の更新検知に使用） */
  summaryHash: string | null;
  /** このエントリの最終更新日時 */
  updatedAt: string;
};

export type LibraryData = {
  version: typeof LIBRARY_DATA_VERSION;
  /** ライブラリ全体の最終更新日時 */
  updatedAt: string | null;
  /** 「端末内にのみ保存される」説明を確認済みか */
  noticeAcknowledged: boolean;
  entries: Record<string, LibraryEntry>;
  watchKeywords: string[];
};

export function createEmptyLibrary(): LibraryData {
  return {
    version: LIBRARY_DATA_VERSION,
    updatedAt: null,
    noticeAcknowledged: false,
    entries: {},
    watchKeywords: [],
  };
}

export const EMPTY_LIBRARY: LibraryData = Object.freeze(createEmptyLibrary());

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asIsoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function normalizeEntry(raw: unknown): LibraryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const articleId = asString(e.articleId).trim();
  const sourceUrl = asString(e.sourceUrl).trim();
  const title = asString(e.title).trim();
  if (!articleId || !title) return null;

  const savedAt = asIsoOrNull(e.savedAt);
  const readAt = asIsoOrNull(e.readAt);
  // 保存も既読もないエントリは意味がないため捨てる
  if (!savedAt && !readAt) return null;

  return {
    articleId,
    sourceUrl,
    title,
    source: asString(e.source).trim(),
    publishedAt: asIsoOrNull(e.publishedAt) ?? new Date(0).toISOString(),
    savedAt,
    readAt,
    summaryHash: asString(e.summaryHash) || null,
    updatedAt:
      asIsoOrNull(e.updatedAt) ?? savedAt ?? readAt ?? new Date(0).toISOString(),
  };
}

export function normalizeWatchKeyword(raw: string): string {
  return raw.trim().slice(0, WATCH_KEYWORD_MAX_LENGTH);
}

function normalizeWatchKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const item of raw) {
    const keyword = normalizeWatchKeyword(String(item ?? ""));
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    keywords.push(keyword);
    if (keywords.length >= WATCH_KEYWORDS_MAX) break;
  }
  return keywords;
}

/**
 * localStorage / インポートJSON から読んだ値を検証・正規化する。
 * 形式として受け入れられない場合は null。
 */
export function parseLibraryData(raw: unknown): LibraryData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  // 将来 version が上がった場合もここで移行処理を差し込める
  if (typeof data.version !== "number" || data.version > LIBRARY_DATA_VERSION) {
    return null;
  }

  const entries: Record<string, LibraryEntry> = {};
  if (data.entries && typeof data.entries === "object") {
    for (const value of Object.values(data.entries)) {
      const entry = normalizeEntry(value);
      if (entry) entries[entry.articleId] = entry;
    }
  }

  return pruneLibrary({
    version: LIBRARY_DATA_VERSION,
    updatedAt: asIsoOrNull(data.updatedAt),
    noticeAcknowledged: data.noticeAcknowledged === true,
    entries,
    watchKeywords: normalizeWatchKeywords(data.watchKeywords),
  });
}

/**
 * エントリ数が上限を超えたら古いものから削除する。
 * 「あとで読む」登録済みより先に、既読のみのエントリを削る。
 */
export function pruneLibrary(data: LibraryData): LibraryData {
  const all = Object.values(data.entries);
  if (all.length <= LIBRARY_MAX_ENTRIES) return data;

  const byOldestFirst = (a: LibraryEntry, b: LibraryEntry) =>
    a.updatedAt.localeCompare(b.updatedAt);
  const readOnly = all.filter((e) => !e.savedAt).sort(byOldestFirst);
  const saved = all.filter((e) => Boolean(e.savedAt)).sort(byOldestFirst);

  let overflow = all.length - LIBRARY_MAX_ENTRIES;
  const removeIds = new Set<string>();
  for (const entry of [...readOnly, ...saved]) {
    if (overflow <= 0) break;
    removeIds.add(entry.articleId);
    overflow -= 1;
  }

  const entries: Record<string, LibraryEntry> = {};
  for (const entry of all) {
    if (!removeIds.has(entry.articleId)) entries[entry.articleId] = entry;
  }
  return { ...data, entries };
}

/** 2つのライブラリを統合する（インポート用）。同じ記事は更新日時が新しい方を残す */
export function mergeLibraries(
  base: LibraryData,
  incoming: LibraryData,
): LibraryData {
  const entries: Record<string, LibraryEntry> = { ...base.entries };
  for (const entry of Object.values(incoming.entries)) {
    const existing = entries[entry.articleId];
    if (!existing || entry.updatedAt > existing.updatedAt) {
      entries[entry.articleId] = entry;
    }
  }
  return pruneLibrary({
    version: LIBRARY_DATA_VERSION,
    updatedAt: new Date().toISOString(),
    noticeAcknowledged: base.noticeAcknowledged || incoming.noticeAcknowledged,
    entries,
    watchKeywords: normalizeWatchKeywords([
      ...base.watchKeywords,
      ...incoming.watchKeywords,
    ]),
  });
}

export function serializeLibrary(data: LibraryData): string {
  return JSON.stringify(data, null, 2);
}

export function isSaved(data: LibraryData, articleId: string): boolean {
  return Boolean(data.entries[articleId]?.savedAt);
}

export function isRead(data: LibraryData, articleId: string): boolean {
  return Boolean(data.entries[articleId]?.readAt);
}

/** 検索テキストに一致した最初のウォッチキーワードを返す（なければ null） */
export function matchedWatchKeyword(
  searchText: string,
  keywords: string[],
): string | null {
  const haystack = searchText.toLowerCase();
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) return keyword;
  }
  return null;
}

export function savedEntries(data: LibraryData): LibraryEntry[] {
  return Object.values(data.entries)
    .filter((e) => Boolean(e.savedAt))
    .sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
}

export function countEntries(data: LibraryData): {
  saved: number;
  read: number;
} {
  let saved = 0;
  let read = 0;
  for (const entry of Object.values(data.entries)) {
    if (entry.savedAt) saved += 1;
    if (entry.readAt) read += 1;
  }
  return { saved, read };
}
