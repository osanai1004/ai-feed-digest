import Image from "next/image";
import Link from "next/link";
import { BrandBadge } from "@/components/ui/brand-badge";
import { PillLink } from "@/components/ui/pill-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_DESCRIPTION_LINES, APP_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/formatDate";

type Props = {
  lastUpdatedAt: string | null;
  memoCount: number;
};

export function HomeHero({ lastUpdatedAt, memoCount }: Props) {
  return (
    <header className="ui-hero animate-fade mb-10 pt-1 sm:mb-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 rounded-[12px] outline-offset-2 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label={`${APP_NAME}のトップへ`}
        >
          <Image
            src="/brand/logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-[10px] shadow-sm"
            priority
          />
          <BrandBadge>更新要約</BrandBadge>
        </Link>
        <div className="flex max-w-full flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
          <PillLink href="/memos">
            メモ{memoCount > 0 ? ` ${memoCount}` : ""}
          </PillLink>
          <PillLink href="/library">保存した記事</PillLink>
          <ThemeToggle />
        </div>
      </div>

      <p className="ui-section-label animate-rise mb-3">AI更新を、先に結論だけ</p>

      <h1 className="font-display animate-rise max-w-2xl break-words text-[42px] leading-[1.05] font-black tracking-[-0.04em] sm:text-[64px]">
        <Link
          href="/"
          className="rounded-[8px] outline-offset-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {APP_NAME}
        </Link>
      </h1>

      <div
        className="animate-accent-draw mt-4 h-[3px] w-16 rounded-full bg-[var(--accent)]"
        aria-hidden="true"
      />

      <p className="animate-rise mt-5 max-w-xl text-[17px] leading-8 text-[var(--body)] sm:text-[18px]">
        {APP_DESCRIPTION_LINES[0]}
        <br />
        {APP_DESCRIPTION_LINES[1]}
        <br />
        {APP_DESCRIPTION_LINES[2]}『
        <span className="font-display font-bold tracking-[-0.02em] text-[var(--ink)]">
          {APP_NAME}
        </span>
        』。
      </p>

      {lastUpdatedAt ? (
        <p className="animate-rise mt-5 text-[13px] text-[var(--mute)]">
          最終更新{" "}
          <time dateTime={lastUpdatedAt}>
            {formatDate(lastUpdatedAt, "long")}
          </time>
        </p>
      ) : null}
    </header>
  );
}
