import { Card } from "@/components/ui/card";
import { PillLink } from "@/components/ui/pill-link";

export function EmptyArticles() {
  return (
    <Card className="p-8 text-center">
      <p className="font-display text-[18px] font-bold">
        該当する記事がありません
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[var(--body)]">
        検索語やジャンルを変えて、もう一度試してください。
      </p>
      <PillLink href="/" className="mt-5">
        条件をクリア
      </PillLink>
    </Card>
  );
}
