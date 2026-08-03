import type { CSSProperties } from "react";
import { styleForSource } from "@/lib/sourceStyles";

type Props = {
  source: string;
  className?: string;
};

export function sourceToneVars(source: string): CSSProperties {
  const tone = styleForSource(source);
  return {
    "--source-badge-bg": tone.badge,
    "--source-badge-fg": tone.text,
    "--source-bar": tone.bar,
  } as CSSProperties;
}

export function SourceBadge({ source, className = "" }: Props) {
  const tone = styleForSource(source);

  return (
    <span
      className={`ui-source-badge${className ? ` ${className}` : ""}`}
      style={
        {
          "--source-badge-bg": tone.badge,
          "--source-badge-fg": tone.text,
        } as CSSProperties
      }
    >
      {source}
    </span>
  );
}
