import { ArticleDetail } from "@/components/article-detail";
import { RelatedArticles } from "@/components/related-articles";
import { ThemeToggle } from "@/components/theme-toggle";
import { PillLink } from "@/components/ui/pill-link";
import { getArticle, getRelatedArticles } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  // 本文は1件だけ読む。関連記事は軽い列で採点してから選ばれた数件だけ読む
  const article = await getArticle(id);
  if (!article) notFound();

  const related = await getRelatedArticles(article);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PillLink href="/">← 一覧へ</PillLink>
        <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
          <PillLink href="/library">保存した記事</PillLink>
          <ThemeToggle />
        </div>
      </div>

      <ArticleDetail article={article} />

      <RelatedArticles articles={related} />
    </main>
  );
}
