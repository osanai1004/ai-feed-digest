import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function PillLink({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`ui-pill-link${className ? ` ${className}` : ""}`}
    >
      {children}
    </Link>
  );
}
