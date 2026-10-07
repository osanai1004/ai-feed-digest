import { discoveryHeading } from "@/lib/articleFilters";
import type { ArticleChannel, ListWindow } from "@/lib/constants";

type Props = {
  channel: ArticleChannel;
  listWindow: ListWindow;
  q: string;
  filtered: boolean;
  resultCount: number;
  totalCount: number;
};

/** 検索条件ではなく、今の範囲で見つかった記事の見出し */
export function ArticleResultsHeader({
  channel,
  listWindow,
  q,
  filtered,
  resultCount,
  totalCount,
}: Props) {
  const countLabel = filtered
    ? `${totalCount}件中 ${resultCount}件を表示`
    : `${resultCount}件`;

  return (
    <header className="results-heading animate-rise">
      <h2 className="font-display">
        {discoveryHeading(channel, listWindow)}
      </h2>
      <p>
        {countLabel}
        {q ? (
          <span className="break-all text-[var(--mute)]"> / 「{q}」</span>
        ) : null}
      </p>
    </header>
  );
}
