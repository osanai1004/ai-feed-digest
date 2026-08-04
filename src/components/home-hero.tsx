import Image from "next/image";
import { BrandBadge } from "@/components/ui/brand-badge";
import { Chip } from "@/components/ui/chip";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

type Props = {
  articleCount: number;
  storageMode: "neon" | "local-json";
};

export function HomeHero({ articleCount, storageMode }: Props) {
  return (
    <header className="ui-hero animate-rise mb-8 overflow-hidden p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt={`${APP_NAME}のロゴ`}
            width={36}
            height={36}
            className="size-9 rounded-[10px] shadow-sm"
            priority
          />
          <BrandBadge>更新要約</BrandBadge>
        </div>
        <ThemeToggle />
      </div>
      <h1 className="font-display max-w-xl text-[34px] leading-[1.08] font-bold tracking-[-0.03em] sm:text-[44px]">
        <span className="text-brand-gradient">{APP_NAME}</span>
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--body)]">
        {APP_DESCRIPTION}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Chip tone="teal">{articleCount}件の要約</Chip>
        <Chip tone="orange">結論ファースト</Chip>
        <Chip tone="sky">
          {storageMode === "neon" ? "自動収集中" : "サンプル表示"}
        </Chip>
      </div>
    </header>
  );
}
