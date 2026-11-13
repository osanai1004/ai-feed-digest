"use client";

import type { GlossarySegment } from "@/lib/glossaryMark";
import type { ArticleTerm } from "@/lib/types";

type Props = {
  as?: "div" | "span";
  className?: string;
  segments: readonly GlossarySegment[];
  activeTerm: string | null;
  onOpen: (term: ArticleTerm) => void;
};

export function GlossaryText({
  as: Tag = "span",
  className,
  segments,
  activeTerm,
  onOpen,
}: Props) {
  return (
    <Tag className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.text}</span>;
        }
        const expanded = activeTerm === segment.term;
        return (
          <button
            key={`${segment.term}-${index}`}
            type="button"
            className="glossary-term"
            data-glossary-term={segment.term}
            aria-haspopup="dialog"
            aria-expanded={expanded}
            onClick={() => onOpen({ term: segment.term, plain: segment.plain })}
          >
            <span className="glossary-term-label">{segment.text}</span>
            <span className="sr-only">の解説を開く</span>
          </button>
        );
      })}
    </Tag>
  );
}
