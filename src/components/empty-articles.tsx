import { Card } from "@/components/ui/card";
import { PillLink } from "@/components/ui/pill-link";
import { buildListHref, type ArticleListQuery } from "@/lib/articleFilters";
import { ARTICLE_CHANNELS, LIST_WINDOWS } from "@/lib/constants";

type Props = {
  query: ArticleListQuery;
};

export function EmptyArticles({ query }: Props) {
  const narrowedByContent = Boolean(query.q || query.category || query.genre);
  const windowLabel =
    LIST_WINDOWS.find((item) => item.slug === query.window)?.label ?? "この期間";
  const channelLabel =
    ARTICLE_CHANNELS.find((item) => item.slug === query.channel)?.label ?? "All";
  const scopeLabel =
    query.channel === "all" ? windowLabel : `${channelLabel}・${windowLabel}`;

  if (query.window !== "all" && !narrowedByContent) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-[18px] font-bold">
          {scopeLabel}の新着はありません
        </p>
        <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
          最初は近い期間だけ出して、チャネルごとに10〜20件ずつ見られるようにしています。
        </p>
        <PillLink
          href={buildListHref({ window: "all", channel: query.channel })}
          className="mt-5"
        >
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
        検索語やチャネル・種別・ソースを変えて、もう一度試してください。
      </p>
      <PillLink
        href={buildListHref({ window: query.window, channel: query.channel })}
        className="mt-5"
      >
        条件をクリア
      </PillLink>
    </Card>
  );
}
