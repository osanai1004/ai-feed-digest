import type { Metadata } from "next";
import { LibraryManager } from "@/components/library-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { PillLink } from "@/components/ui/pill-link";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `保存した記事 | ${APP_NAME}`,
  description:
    "この端末に保存した記事・既読・ウォッチキーワードの管理ページです。",
  // 端末ごとの個人用ページのため検索エンジンに載せない
  robots: { index: false, follow: false },
};

export default function LibraryPage() {
  return (
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
      <div className="mb-7 flex items-center justify-between gap-3">
        <PillLink href="/">← 一覧へ</PillLink>
        <ThemeToggle />
      </div>

      <header className="animate-rise mb-7">
        <p className="ui-section-label mb-2">この端末の記録</p>
        <h1 className="font-display text-[32px] leading-tight font-black tracking-[-0.03em] sm:text-[40px]">
          保存した記事
        </h1>
        <div
          className="animate-accent-draw mt-3 h-[3px] w-12 rounded-full bg-[var(--accent)]"
          aria-hidden="true"
        />
        <p className="mt-4 text-[14px] leading-7 text-[var(--body)]">
          「あとで読む」記事と、既読・ウォッチキーワードをまとめて管理できます。
        </p>
      </header>

      <LibraryManager />
    </main>
  );
}
