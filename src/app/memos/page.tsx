import { MemoList } from "@/components/memo-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { PillLink } from "@/components/ui/pill-link";
import { listMemos } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MemosPage() {
  const memos = await listMemos();

  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PillLink href="/">← 一覧へ</PillLink>
        <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
          <PillLink href="/library">保存した記事</PillLink>
          <ThemeToggle />
        </div>
      </div>

      <header className="mb-6">
        <p className="ui-section-label mb-2">公式URLなし</p>
        <h1 className="font-display text-[32px] leading-tight font-black tracking-[-0.03em] sm:text-[40px]">
          メモ
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-7 text-[var(--body)]">
          Xで見えた話のうち、公式の一次情報が見つからなかったものです。要約記事にはしていません。
        </p>
      </header>

      <MemoList memos={memos} />
    </main>
  );
}
