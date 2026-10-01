import { ArticleListControls } from "@/components/article-list-controls";
import { ArticleListView } from "@/components/article-list-view";
import { HomeHero } from "@/components/home-hero";
import {
  availableCategories,
  availableGenres,
  filterArticles,
  filterByChannel,
  filterByListWindow,
  parseArticleListQuery,
} from "@/lib/articleFilters";
import { listArticles, listMemos } from "@/lib/store";

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
  const inWindow = filterByListWindow(articles, query.window);
  const inChannel = filterByChannel(inWindow, query.channel);
  const categories = availableCategories(inChannel);
  const genres = availableGenres(inChannel, query.category);
  const filtered = filterArticles(inChannel, query);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
      <HomeHero
        lastUpdatedAt={latestCreatedAt(articles)}
        memoCount={memos.length}
      />

      <ArticleListControls
        q={query.q}
        channel={query.channel}
        category={query.category}
        genre={query.genre}
        window={query.window}
        categories={categories}
        genres={genres}
        resultCount={filtered.length}
        totalCount={inChannel.length}
      />

      <ArticleListView articles={filtered} query={query} />
    </main>
  );
}
