import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  soft?: boolean;
  className?: string;
};

export function Card({ children, soft = false, className = "" }: Props) {
  const base = soft ? "ui-card-soft" : "ui-card";
  return (
    <div className={`${base}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
