import { ArticleListView } from "@/components/article-list-view";
import { HomeHero } from "@/components/home-hero";
import {
  articlesInBrowseScope,
  availableCategories,
  availableGenres,
  filterArticles,
  isSearchQuery,
  parseArticleListQuery,
  showXChannelSort,
} from "@/lib/articleFilters";
import { listArticles, listMemos } from "@/lib/store";
import { sortXChannelArticles } from "@/lib/xMetrics";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function latestCreatedAt(articles: { createdAt: string }[]): string | null {
  if (articles.length === 0) return null;
  return articles.reduce(
    (latest, article) =>
      article.createdAt > latest ? article.createdAt : latest,
    articles[0].createdAt,
  );
}

export default async function HomePage({ searchParams }: Props) {
  const articles = await listArticles();
  const memos = await listMemos();
  const query = parseArticleListQuery(await searchParams);
  const searching = isSearchQuery(query);
  const scoped = articlesInBrowseScope(articles, query);
  const facetBase = searching
    ? filterArticles(scoped, { q: query.q, category: "", genre: "" })
    : scoped;
  const categories = availableCategories(facetBase);
  const genres = availableGenres(facetBase, query.category);
  const filtered = filterArticles(scoped, query);
  const listed = showXChannelSort(query)
    ? sortXChannelArticles(filtered, query.sort)
    : filtered;

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
      <ArticleListView
        mast={
          <HomeHero
            lastUpdatedAt={latestCreatedAt(articles)}
            memoCount={memos.length}
          />
        }
        articles={listed}
        query={query}
        categories={categories}
        genres={genres}
        resultCount={filtered.length}
        totalCount={facetBase.length}
      />
    </main>
  );
}
