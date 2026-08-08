import type { ReactNode } from "react";

const TONE_CLASS = {
  teal: "ui-chip ui-chip-teal",
  orange: "ui-chip ui-chip-orange",
  sky: "ui-chip ui-chip-sky",
  soft: "ui-chip ui-chip-soft",
  brand: "ui-chip ui-chip-brand",
} as const;

export type ChipTone = keyof typeof TONE_CLASS;

type Props = {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Chip({
  tone = "soft",
  children,
  className = "",
  title,
}: Props) {
  return (
    <span
      title={title}
      className={`${TONE_CLASS[tone]}${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}
