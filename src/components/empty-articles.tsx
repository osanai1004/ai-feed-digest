import { EmptyState } from "@/components/ui/empty-state";
import { PillLink } from "@/components/ui/pill-link";
import {
  buildListHref,
  listScopeLabel,
  type ArticleListQuery,
} from "@/lib/articleFilters";

type Props = {
  query: ArticleListQuery;
};

export function EmptyArticles({ query }: Props) {
  const narrowedByContent = Boolean(query.q || query.category || query.genre);
  const narrowedByWindow = query.window !== "all";
  const narrowedByChannel = query.channel !== "all";
  const scopeLabel = listScopeLabel(query.channel, query.window);
  const sort = query.channel === "x" ? query.sort : undefined;

  if (!narrowedByContent && !narrowedByWindow && !narrowedByChannel) {
    return (
      <EmptyState
        title="記事はまだありません"
        body="取り込みが済むと、ここに要約が出ます。"
      />
    );
  }

  if (!narrowedByContent && narrowedByWindow) {
    return (
      <EmptyState
        title={`${scopeLabel}の新着はありません`}
        body="近い期間だけを先に出しています。期間を広げると、前の記事も見られます。"
      >
        <PillLink
          href={buildListHref({
            window: "all",
            channel: query.channel,
            sort,
          })}
        >
          全期間を見る
        </PillLink>
      </EmptyState>
    );
  }

  return (
    <EmptyState
      title="該当する記事がありません"
      body={
        narrowedByWindow
          ? `${scopeLabel}では、この条件に合う記事がありません。絞り込みを外すか、期間を広げてみてください。`
          : "検索語やチャネル・種別・ソースを変えると、別の記事が見つかります。"
      }
    >
      {narrowedByContent ? (
        <PillLink
          href={buildListHref({
            window: query.window,
            channel: query.channel,
            sort,
          })}
        >
          条件をクリア
        </PillLink>
      ) : null}
      {narrowedByWindow ? (
        <PillLink
          href={buildListHref({
            q: query.q,
            channel: query.channel,
            category: query.category || undefined,
            genre: query.genre || undefined,
            window: "all",
            sort,
          })}
        >
          全期間を見る
        </PillLink>
      ) : null}
      {narrowedByChannel && !narrowedByContent ? (
        <PillLink
          href={buildListHref({
            window: query.window,
            channel: "all",
          })}
        >
          すべてのチャネルを見る
        </PillLink>
      ) : null}
    </EmptyState>
  );
}
