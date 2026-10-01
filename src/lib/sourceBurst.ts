import { SOURCE_BURST_GAP_MS, SOURCE_BURST_MIN } from "./constants";
import type { Article } from "./types";

export type ArticleListEntry =
  | { kind: "article"; article: Article }
  | { kind: "burst"; source: string; articles: Article[] };

/**
 * 新しい順の一覧で、同じソースが短い間隔で 3 件以上続くときだけ束ねる。
 * 離れた単発はそのまま出す。
 */
export function bundleSourceBursts(articles: Article[]): ArticleListEntry[] {
  const entries: ArticleListEntry[] = [];
  let index = 0;

  while (index < articles.length) {
    const head = articles[index];
    let end = index + 1;
    while (end < articles.length && articles[end].source === head.source) {
      const newer = new Date(articles[end - 1].publishedAt).getTime();
      const older = new Date(articles[end].publishedAt).getTime();
      const gap = newer - older;
      if (!Number.isFinite(gap) || gap < 0 || gap > SOURCE_BURST_GAP_MS) break;
      end += 1;
    }

    const group = articles.slice(index, end);
    if (group.length >= SOURCE_BURST_MIN) {
      entries.push({ kind: "burst", source: head.source, articles: group });
    } else {
      for (const article of group) {
        entries.push({ kind: "article", article });
      }
    }
    index = end;
  }

  return entries;
}
