import {
  DEFAULT_LIST_WINDOW,
  LIST_WINDOWS,
  LIST_WINDOW_RECENT_MS,
  type ListWindow,
} from "./constants";

export function parseListWindow(value: string | undefined): ListWindow {
  const raw = (value ?? "").trim().toLowerCase();
  return LIST_WINDOWS.find((item) => item.slug === raw)?.slug ?? DEFAULT_LIST_WINDOW;
}

/** 一覧の初期表示を近い期間に限る（SQL 側は articleQueries.ts の同じ条件） */
export function isInListWindow(
  publishedAt: string,
  window: ListWindow,
  now: Date = new Date(),
): boolean {
  if (window === "all") return true;
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return false;

  const delta = now.getTime() - published.getTime();
  return delta >= 0 && delta <= LIST_WINDOW_RECENT_MS;
}
