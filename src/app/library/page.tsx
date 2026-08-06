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
    <main className="mx-auto min-h-full w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <PillLink href="/">← 一覧へ</PillLink>
        <ThemeToggle />
      </div>

      <header className="animate-rise mb-6">
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-0.02em] sm:text-[34px]">
          保存した記事
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
          「あとで読む」記事と、既読・ウォッチキーワードをまとめて管理できます。
        </p>
      </header>

      <LibraryManager />
    </main>
  );
}
