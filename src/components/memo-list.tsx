import { SourceBadge, XSignalBadge } from "@/components/ui/source-badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatDate";
import { safeExternalUrl } from "@/lib/safeUrl";
import type { IntakeSignal } from "@/lib/types";

type Props = {
  memos: IntakeSignal[];
};

export function MemoList({ memos }: Props) {
  if (memos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-[18px] font-bold">メモはありません</p>
        <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
          公式の一次情報が見つからない X の投稿は、記事にせずここに残します。
        </p>
      </Card>
    );
  }

  return (
    <section className="grid gap-3">
      {memos.map((memo) => {
        const postUrl = safeExternalUrl(memo.xPostUrl);
        return (
          <article key={memo.id} className="ui-article-row p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <SourceBadge source={memo.source} />
              {memo.source.trim().toLowerCase() !== "x" ? <XSignalBadge /> : null}
              <time
                dateTime={memo.publishedAt}
                className="text-[12px] font-semibold text-[var(--mute)]"
              >
                {formatDate(memo.publishedAt, "short")}
              </time>
            </div>
            <h2 className="font-display break-words text-[20px] leading-snug font-bold">
              {memo.title}
            </h2>
            <p className="mt-3 text-[13px] font-bold text-[var(--ink-soft)]">
              公式の一次情報がないため、記事ではなくメモです。
            </p>
            <p className="mt-3 break-words whitespace-pre-wrap text-[14px] leading-7 text-[var(--body)]">
              {memo.body}
            </p>
            {memo.author ? (
              <p className="mt-3 text-[12px] font-semibold text-[var(--mute)]">
                {memo.author}
              </p>
            ) : null}
            {postUrl ? (
              <p className="mt-4">
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-bold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  Xの投稿を見る
                </a>
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
