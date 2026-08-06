import { articleMatchesGenre } from "./articleFilters";
import { ARTICLE_GENRES, RELATED_ARTICLES_MAX } from "./constants";
import type { Article } from "./types";

/**
 * 関連ニュースの抽出（サーバー側で実行する純粋ロジック）。
 * 同じ情報源・同じジャンル・タイトルの語の重なりでスコア付けし、
 * 一定スコア以上を新しい順で返す。
 */

/** タイトルの語比較から除外する一般語 */
const TITLE_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "are",
  "was",
  "has",
  "have",
  "how",
  "what",
  "you",
  "your",
  "its",
  "new",
  "now",
  "can",
  "will",
  "into",
  "more",
  "our",
  "about",
  "update",
  "updates",
  "release",
  "releases",
  "introducing",
  "announcing",
  "available",
]);

/** 関連とみなす最低スコア */
const RELATED_MIN_SCORE = 2;

function titleTokens(title: string): Set<string> {
  const tokens = title.toLowerCase().match(/[a-z0-9.+#-]{3,}/g) ?? [];
  return new Set(tokens.filter((token) => !TITLE_STOPWORDS.has(token)));
}

function genreSlugs(article: Article): Set<string> {
  return new Set(
    ARTICLE_GENRES.filter((genre) =>
      articleMatchesGenre(article, genre.slug),
    ).map((genre) => genre.slug),
  );
}

export function findRelatedArticles(
  target: Article,
  articles: Article[],
  limit: number = RELATED_ARTICLES_MAX,
): Article[] {
  const targetTokens = titleTokens(target.title);
  const targetGenres = genreSlugs(target);

  const scored = articles
    .filter((article) => article.id !== target.id)
    .map((article) => {
      let score = 0;
      if (article.source === target.source) score += 3;

      for (const slug of genreSlugs(article)) {
        if (targetGenres.has(slug)) score += 2;
      }

      let tokenMatches = 0;
      for (const token of titleTokens(article.title)) {
        if (targetTokens.has(token)) tokenMatches += 1;
      }
      score += Math.min(tokenMatches, 3);

      return { article, score };
    })
    .filter((item) => item.score >= RELATED_MIN_SCORE);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.article.publishedAt.localeCompare(a.article.publishedAt);
  });

  return scored.slice(0, limit).map((item) => item.article);
}
