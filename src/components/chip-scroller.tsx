"use client";

import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  labelledBy?: string;
  /** キーワード一覧は ul、チップ群は div */
  as?: "div" | "ul";
  className?: string;
};

const MORE_BUTTON_RESERVE_PX = 112;

/**
 * チップを原則1行にし、はみ出しは横スクロールする。
 * 幅の2倍を超えるときだけ「もっと見る」で2行目を出す。3行目にはしない。
 */
export function ChipScroller({
  children,
  labelledBy,
  as = "div",
  className,
}: Props) {
  const items = Children.toArray(children).filter(Boolean);
  const itemKey = items
    .map((item) => (isValidElement(item) ? String(item.key) : ""))
    .join("\0");
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLElement | null>(null);
  const [wide, setWide] = useState(false);
  const [splitAt, setSplitAt] = useState(items.length);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;

    const update = () => {
      const chips = Array.from(measure.children) as HTMLElement[];
      const available = viewport.clientWidth;
      if (available <= 0 || chips.length === 0) return;
      const styles = getComputedStyle(measure);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "8") || 8;
      let total = 0;
      for (let i = 0; i < chips.length; i += 1) {
        total += chips[i].offsetWidth + (i > 0 ? gap : 0);
      }
      const isWide = total > available * 2 && chips.length > 1;
      let nextSplit = chips.length;
      if (isWide) {
        const limit = Math.max(available - MORE_BUTTON_RESERVE_PX, 48);
        let used = 0;
        let fit = 0;
        for (let i = 0; i < chips.length; i += 1) {
          const next = used + (i > 0 ? gap : 0) + chips[i].offsetWidth;
          if (next > limit) break;
          used = next;
          fit = i + 1;
        }
        nextSplit = Math.min(Math.max(fit, 1), chips.length - 1);
      }
      setWide((prev) => (prev === isWide ? prev : isWide));
      setSplitAt((prev) => (prev === nextSplit ? prev : nextSplit));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    const fonts = document.fonts;
    void fonts?.ready.then(update);
    return () => observer.disconnect();
  }, [itemKey]);

  if (items.length === 0) return null;

  const RowTag = as;
  const expandedNow = expanded && wide;
  const rowLabel = labelledBy ? { "aria-labelledby": labelledBy } : {};
  const groupRole = as === "div" ? { role: "group" as const } : {};

  const scrollerClass = ["chip-scroller", className].filter(Boolean).join(" ");

  return (
    <div className={scrollerClass} ref={viewportRef}>
      <div className="chip-scroller-live">
        {expandedNow ? (
          <>
            <div className="chip-scroller-head">
              <RowTag className="chip-scroller-row" {...groupRole} {...rowLabel}>
                {items.slice(0, splitAt)}
              </RowTag>
              <MoreButton expanded onClick={() => setExpanded(false)} />
            </div>
            <RowTag
              className="chip-scroller-row is-scroll"
              {...groupRole}
              {...rowLabel}
            >
              {items.slice(splitAt)}
            </RowTag>
          </>
        ) : wide ? (
          <div className="chip-scroller-head">
            <RowTag
              className="chip-scroller-row is-scroll"
              {...groupRole}
              {...rowLabel}
            >
              {items}
            </RowTag>
            <MoreButton expanded={false} onClick={() => setExpanded(true)} />
          </div>
        ) : (
          <RowTag
            className="chip-scroller-row is-scroll"
            {...groupRole}
            {...rowLabel}
          >
            {items}
          </RowTag>
        )}
      </div>
      {as === "ul" ? (
        <ul
          ref={(node) => {
            measureRef.current = node;
          }}
          className="chip-scroller-measure"
          inert
          aria-hidden="true"
        >
          {items}
        </ul>
      ) : (
        <div
          ref={(node) => {
            measureRef.current = node;
          }}
          className="chip-scroller-measure"
          inert
          aria-hidden="true"
        >
          {items}
        </div>
      )}
    </div>
  );
}

function MoreButton({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="chip-scroller-more"
      aria-expanded={expanded}
      onClick={onClick}
    >
      {expanded ? "閉じる" : "もっと見る"}
    </button>
  );
}
