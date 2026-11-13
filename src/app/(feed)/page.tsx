import { ArticleListView } from "@/components/article-list-view";
import { HomeHero } from "@/components/home-hero";
import {
  availableCategories,
  availableGenres,
  parseArticleListQuery,
} from "@/lib/articleFilters";
import { countMemos, queryHomeArticles } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: Props) {
  const query = parseArticleListQuery(await searchParams);
  // 期間・チャネル・並び・検索の粗い絞り込みは SQL 側。全記事は読まない
  const { listed, facetBase, lastUpdatedAt } = await queryHomeArticles(query);
  const memoCount = await countMemos();
  const categories = availableCategories(facetBase);
  const genres = availableGenres(facetBase, query.category);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
      <ArticleListView
        mast={
          <HomeHero
            lastUpdatedAt={lastUpdatedAt}
            memoCount={memoCount}
          />
        }
        articles={listed}
        query={query}
        categories={categories}
        genres={genres}
        resultCount={listed.length}
        totalCount={facetBase.length}
      />
    </main>
  );
}
