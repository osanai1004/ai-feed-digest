import { BrandBadge } from "@/components/ui/brand-badge";
import { Chip } from "@/components/ui/chip";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  articleCount: number;
  storageMode: "neon" | "local-json";
};

export function HomeHero({ articleCount, storageMode }: Props) {
  return (
    <header className="ui-hero animate-rise mb-8 overflow-hidden p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <BrandBadge>AI更新要約</BrandBadge>
        <ThemeToggle />
      </div>
      <h1 className="font-display max-w-xl text-[34px] leading-[1.08] font-bold tracking-[-0.03em] sm:text-[44px]">
        ChatGPT・Claude・Geminiの
        <span className="text-brand-gradient">公式更新を要約</span>
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--body)]">
        結論と「使える場面」つきのカードで毎日キャッチアップ。
        気になった更新だけ元記事を開けばOK。
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
