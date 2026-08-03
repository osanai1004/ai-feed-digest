import {
  ARTICLE_GENRES,
  ARTICLES_PER_PAGE,
  type GenreSlug,
} from "./constants";
import type { Article } from "./types";

export type ArticleListQuery = {
  q: string;
  genre: GenreSlug | "";
  page: number;
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
  const genreRaw = (firstParam(searchParams.genre) ?? "").trim().toLowerCase();
  const genre =
    ARTICLE_GENRES.find((g) => g.slug === genreRaw)?.slug ?? "";
  const pageRaw = Number.parseInt(firstParam(searchParams.page) ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, genre, page };
}

function articleSearchText(article: Article): string {
  return [
    article.title,
    article.source,
    article.summary.conclusion,
    ...article.summary.situations,
  ]
    .join("\n")
    .toLowerCase();
}

export function articleMatchesGenre(
  article: Article,
  genreSlug: GenreSlug,
): boolean {
  const genre = ARTICLE_GENRES.find((g) => g.slug === genreSlug);
  if (!genre) return false;

  const haystack = `${article.source}\n${article.title}`.toLowerCase();
  return genre.keywords.some((keyword) => haystack.includes(keyword));
}

export function filterArticles(
  articles: Article[],
  query: Pick<ArticleListQuery, "q" | "genre">,
): Article[] {
  const needle = query.q.toLowerCase();

  return articles.filter((article) => {
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

/** 記事が1件以上あるジャンルだけ返す */
export function availableGenres(articles: Article[]) {
  return ARTICLE_GENRES.filter((genre) =>
    articles.some((article) => articleMatchesGenre(article, genre.slug)),
  );
}

export function buildListHref(params: {
  q?: string;
  genre?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  const q = params.q?.trim();
  if (q) sp.set("q", q);
  if (params.genre) sp.set("genre", params.genre);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}
