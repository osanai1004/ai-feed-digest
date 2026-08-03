import { ArticleDetail } from "@/components/article-detail";
import { ThemeToggle } from "@/components/theme-toggle";
import { PillLink } from "@/components/ui/pill-link";
import { getArticle } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <PillLink href="/">← 一覧へ</PillLink>
        <ThemeToggle />
      </div>

      <ArticleDetail article={article} />
    </main>
  );
}
