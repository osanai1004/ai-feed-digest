import { ArticleCard } from "@/components/article-card";
import { ArticleListControls } from "@/components/article-list-controls";
import { ArticlePagination } from "@/components/article-pagination";
import { EmptyArticles } from "@/components/empty-articles";
import { HomeHero } from "@/components/home-hero";
import {
  availableCategories,
  availableGenres,
  filterArticles,
  paginateArticles,
  parseArticleListQuery,
} from "@/lib/articleFilters";
import { listArticles, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: Props) {
  const articles = await listArticles();
  const mode = storageMode();
  const query = parseArticleListQuery(await searchParams);
  const categories = availableCategories(articles);
  const genres = availableGenres(articles, query.category);
  const filtered = filterArticles(articles, query);
  const pageResult = paginateArticles(filtered, query.page);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <HomeHero articleCount={articles.length} storageMode={mode} />

      <ArticleListControls
        q={query.q}
        category={query.category}
        genre={query.genre}
        categories={categories}
        genres={genres}
        resultCount={filtered.length}
        totalCount={articles.length}
      />

      <section className="grid gap-4">
        {pageResult.items.length === 0 ? (
          <EmptyArticles />
        ) : (
          pageResult.items.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))
        )}
      </section>

      <ArticlePagination
        q={query.q}
        category={query.category}
        genre={query.genre}
        page={pageResult.page}
        totalPages={pageResult.totalPages}
        total={pageResult.total}
      />
    </main>
  );
}
