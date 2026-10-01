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

/** X の投稿がきっかけの記事・メモに付ける印 */
export function XSignalBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Xの投稿がきっかけ"
      className={`ui-source-badge ui-x-badge${className ? ` ${className}` : ""}`}
    >
      X
    </span>
  );
}

export function SourceBadge({ source, className = "" }: Props) {
  const tone = styleForSource(source);

  return (
    <span
      title={source}
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
