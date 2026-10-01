import { Card } from "@/components/ui/card";
import { PillLink } from "@/components/ui/pill-link";
import { buildListHref, type ArticleListQuery } from "@/lib/articleFilters";
import { LIST_WINDOWS } from "@/lib/constants";

type Props = {
  query: ArticleListQuery;
};

export function EmptyArticles({ query }: Props) {
  const narrowedByContent = Boolean(query.q || query.category || query.genre);
  const windowLabel =
    LIST_WINDOWS.find((item) => item.slug === query.window)?.label ?? "この期間";

  if (query.window !== "all" && !narrowedByContent) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-[18px] font-bold">
          {windowLabel}の新着はありません
        </p>
        <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
          最初は近い期間だけ出して、同じソースの連続更新で埋もれにくくしています。
        </p>
        <PillLink href={buildListHref({ window: "all" })} className="mt-5">
          全期間を見る
        </PillLink>
      </Card>
    );
  }

  return (
    <Card className="p-8 text-center">
      <p className="font-display text-[18px] font-bold">
        該当する記事がありません
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
        検索語や種別・ソースを変えて、もう一度試してください。
      </p>
      <PillLink href={buildListHref({ window: query.window })} className="mt-5">
        条件をクリア
      </PillLink>
    </Card>
  );
}
