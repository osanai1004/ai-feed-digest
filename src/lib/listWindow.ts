import {
  DEFAULT_LIST_WINDOW,
  LIST_WINDOWS,
  LIST_WINDOW_24H_MS,
  type ListWindow,
} from "./constants";

const TOKYO_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function parseListWindow(value: string | undefined): ListWindow {
  const raw = (value ?? "").trim().toLowerCase();
  return LIST_WINDOWS.find((item) => item.slug === raw)?.slug ?? DEFAULT_LIST_WINDOW;
}

/** 一覧の初期表示を近い期間に限る。今日は日本時間の暦日 */
export function isInListWindow(
  publishedAt: string,
  window: ListWindow,
  now: Date = new Date(),
): boolean {
  if (window === "all") return true;
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return false;

  if (window === "24h") {
    const delta = now.getTime() - published.getTime();
    return delta >= 0 && delta <= LIST_WINDOW_24H_MS;
  }

  return TOKYO_DAY.format(published) === TOKYO_DAY.format(now);
}
