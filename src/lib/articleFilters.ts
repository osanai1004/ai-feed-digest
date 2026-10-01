import {
  ARTICLE_CATEGORIES,
  ARTICLE_GENRES,
  ARTICLES_PER_PAGE,
  DEFAULT_LIST_WINDOW,
  type CategorySlug,
  type GenreSlug,
  type ListWindow,
} from "./constants";
import { isInListWindow, parseListWindow } from "./listWindow";
import type { Article } from "./types";

export type ArticleListQuery = {
  q: string;
  category: CategorySlug | "";
  genre: GenreSlug | "";
  page: number;
  window: ListWindow;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseArticleListQuery(searchParams: {
  [key: string]: string | string[] | undefined;
}): ArticleListQuery {
  const q = (firstParam(searchParams.q) ?? "").trim();
  const categoryRaw = (firstParam(searchParams.category) ?? "")
    .trim()
    .toLowerCase();
  const category =
    ARTICLE_CATEGORIES.find((c) => c.slug === categoryRaw)?.slug ?? "";
  const genreRaw = (firstParam(searchParams.genre) ?? "").trim().toLowerCase();
  const genreMatch = ARTICLE_GENRES.find((g) => g.slug === genreRaw);
  // 大分類と矛盾するジャンルは無視する
  const genre =
    genreMatch && (!category || genreMatch.category === category)
      ? genreMatch.slug
      : "";
  const pageRaw = Number.parseInt(firstParam(searchParams.page) ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const window = parseListWindow(firstParam(searchParams.window));

  return { q, category, genre, page, window };
}

export function filterByListWindow(
  articles: Article[],
  window: ListWindow,
  now: Date = new Date(),
): Article[] {
  return articles.filter((article) =>
    isInListWindow(article.publishedAt, window, now),
  );
}

/** 検索・ウォッチキーワード照合に使う記事の全文テキスト */
export function articleSearchText(article: Article): string {
  const voices = [article.summary.general, article.summary.engineer];
  return [
    article.title,
    article.source,
    ...voices.flatMap((voice) => [
      voice.conclusion,
      voice.detail,
      ...voice.situations,
      ...voice.terms.flatMap((term) => [term.term, term.plain]),
    ]),
  ]
    .join("\n")
    .toLowerCase();
}

function genreHaystack(article: Article): string {
  return `${article.source}\n${article.title}`.toLowerCase();
}

/**
 * ソース名とタイトルが一致したジャンル。
 * 「claude code」のように長い語が短い語（claude）を含むときは、長い語のジャンルだけ残す。
 * 互いを含まない語（Cloudflare と security など）は両方残る。
 */
function genresMatchingArticle(article: Article) {
  const haystack = genreHaystack(article);
  const hits = ARTICLE_GENRES.map((genre) => ({
    genre,
    keywords: genre.keywords.filter((keyword) => haystack.includes(keyword)),
  })).filter((hit) => hit.keywords.length > 0);

  return hits
    .filter((hit) =>
      hit.keywords.some(
        (keyword) =>
          !hits.some(
            (other) =>
              other.genre.slug !== hit.genre.slug &&
              other.keywords.some(
                (otherKeyword) =>
                  otherKeyword.length > keyword.length &&
                  otherKeyword.includes(keyword),
              ),
          ),
      ),
    )
    .map((hit) => hit.genre);
}

export function articleMatchesGenre(
  article: Article,
  genreSlug: GenreSlug,
): boolean {
  return genresMatchingArticle(article).some((genre) => genre.slug === genreSlug);
}

export function articleMatchesCategory(
  article: Article,
  categorySlug: CategorySlug,
): boolean {
  return genresMatchingArticle(article).some(
    (genre) => genre.category === categorySlug,
  );
}

export function filterArticles(
  articles: Article[],
  query: Pick<ArticleListQuery, "q" | "category" | "genre">,
): Article[] {
  const needle = query.q.toLowerCase();

  return articles.filter((article) => {
    if (
      query.category &&
      !articleMatchesCategory(article, query.category)
    ) {
      return false;
    }
    if (query.genre && !articleMatchesGenre(article, query.genre)) {
      return false;
    }
    if (!needle) return true;
    return articleSearchText(article).includes(needle);
  });
}

export function paginateArticles<T>(
  items: T[],
  page: number,
  pageSize: number = ARTICLES_PER_PAGE,
): {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: T[];
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

/** 記事が1件以上あるジャンルだけ返す（大分類指定時はその系統のみ） */
export function availableGenres(
  articles: Article[],
  category: CategorySlug | "" = "",
) {
  return ARTICLE_GENRES.filter((genre) => {
    if (category && genre.category !== category) return false;
    return articles.some((article) => articleMatchesGenre(article, genre.slug));
  });
}

/** 記事が1件以上ある大分類だけ返す */
export function availableCategories(articles: Article[]) {
  return ARTICLE_CATEGORIES.filter((category) =>
    articles.some((article) => articleMatchesCategory(article, category.slug)),
  );
}

export function buildListHref(params: {
  q?: string;
  category?: string;
  genre?: string;
  page?: number;
  window?: ListWindow;
}): string {
  const sp = new URLSearchParams();
  const q = params.q?.trim();
  if (q) sp.set("q", q);
  if (params.category) sp.set("category", params.category);
  if (params.genre) sp.set("genre", params.genre);
  if (params.window && params.window !== DEFAULT_LIST_WINDOW) {
    sp.set("window", params.window);
  }
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}
