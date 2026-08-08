import { ArticleDetail } from "@/components/article-detail";
import { RelatedArticles } from "@/components/related-articles";
import { ThemeToggle } from "@/components/theme-toggle";
import { PillLink } from "@/components/ui/pill-link";
import { findRelatedArticles } from "@/lib/relatedArticles";
import { listArticles } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const articles = await listArticles();
  const article = articles.find((a) => a.id === id);
  if (!article) notFound();

  const related = findRelatedArticles(article, articles);

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
