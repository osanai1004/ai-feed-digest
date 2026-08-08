import { ArticleListControls } from "@/components/article-list-controls";
import { ArticleListView } from "@/components/article-list-view";
import { HomeHero } from "@/components/home-hero";
import {
  availableCategories,
  availableGenres,
  filterArticles,
  parseArticleListQuery,
} from "@/lib/articleFilters";
import { listArticles } from "@/lib/store";

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
  const query = parseArticleListQuery(await searchParams);
  const categories = availableCategories(articles);
  const genres = availableGenres(articles, query.category);
  const filtered = filterArticles(articles, query);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <HomeHero lastUpdatedAt={latestCreatedAt(articles)} />

      <ArticleListControls
        q={query.q}
        category={query.category}
        genre={query.genre}
        categories={categories}
        genres={genres}
        resultCount={filtered.length}
        totalCount={articles.length}
      />

      <ArticleListView articles={filtered} query={query} />
    </main>
  );
}
