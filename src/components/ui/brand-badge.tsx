import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function BrandBadge({ children }: Props) {
  return <span className="ui-brand-badge">{children}</span>;
}
