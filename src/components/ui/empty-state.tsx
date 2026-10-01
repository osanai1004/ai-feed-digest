import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  body: string;
  children?: ReactNode;
};

export function EmptyState({ title, body, children }: Props) {
  return (
    <Card className="px-5 py-10 text-center sm:px-8">
      <p className="font-display text-[18px] leading-snug font-bold tracking-[-0.02em]">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[var(--body)]">
        {body}
      </p>
      {children ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </Card>
  );
}
