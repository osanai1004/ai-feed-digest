import Image from "next/image";
import Link from "next/link";
import { BrandBadge } from "@/components/ui/brand-badge";
import { PillLink } from "@/components/ui/pill-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_DESCRIPTION_LINES, APP_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/formatDate";

type Props = {
  lastUpdatedAt: string | null;
};

export function HomeHero({ lastUpdatedAt }: Props) {
  return (
    <header className="ui-hero animate-rise mb-8 overflow-hidden p-5 sm:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <PillLink href="/library">保存した記事</PillLink>
          <ThemeToggle />
        </div>
      </div>
      <h1 className="font-display max-w-xl break-words text-[32px] leading-[1.08] font-bold tracking-[-0.03em] sm:text-[44px]">
        <Link
          href="/"
          className="text-brand-gradient rounded-[8px] outline-offset-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {APP_NAME}
        </Link>
      </h1>
      <p className="mt-4 max-w-xl text-[17px] leading-7 text-[var(--body)] sm:text-[18px]">
        {APP_DESCRIPTION_LINES[0]}
        それが『
        <span className="text-brand-gradient font-display font-bold tracking-[-0.02em]">
          {APP_NAME}
        </span>
        』
        <br />
        {APP_DESCRIPTION_LINES[1]}
      </p>
      {lastUpdatedAt ? (
        <p className="mt-4 text-[13px] text-[var(--mute)]">
          最終更新{" "}
          <time dateTime={lastUpdatedAt}>
            {formatDate(lastUpdatedAt, "long")}
          </time>
        </p>
      ) : null}
    </header>
  );
}
