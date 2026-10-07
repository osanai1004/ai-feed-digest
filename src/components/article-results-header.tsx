import { isSearchQuery, resultsHeading } from "@/lib/articleFilters";
import type { ArticleChannel, ListWindow } from "@/lib/constants";

type Props = {
  channel: ArticleChannel;
  listWindow: ListWindow;
  q: string;
  /** 種別・ソースでさらに絞っている */
  refined: boolean;
  resultCount: number;
  totalCount: number;
};

/** 検索中は「検索結果」。それ以外はチャネルと期間の発見見出し */
export function ArticleResultsHeader({
  channel,
  listWindow,
  q,
  refined,
  resultCount,
  totalCount,
}: Props) {
  const searching = isSearchQuery({ q });
  const countLabel = refined
    ? `${totalCount}件中 ${resultCount}件を表示`
    : `${resultCount}件`;

  return (
    <header className="results-heading animate-rise">
      <h2 className="font-display">
        {resultsHeading({ q, channel, window: listWindow })}
      </h2>
      <p>
        {countLabel}
        {searching ? (
          <span className="break-all text-[var(--mute)]"> / 「{q}」</span>
        ) : null}
      </p>
    </header>
  );
}
