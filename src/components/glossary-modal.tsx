"use client";

import { useEffect, useId, useRef } from "react";
import type { ArticleTerm } from "@/lib/types";

type Props = {
  term: ArticleTerm | null;
  onClose: () => void;
};

/**
 * 用語の一口解説。ネイティブの dialog でフォーカスを閉じ込め、
 * Esc・外クリック・閉じるボタンで閉じる。
 */
export function GlossaryModal({ term, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  const ignoreCloseRef = useRef(false);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!term) {
      if (dialog.open) {
        ignoreCloseRef.current = true;
        dialog.close();
        ignoreCloseRef.current = false;
      }
      return;
    }

    if (!dialog.open) dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (!dialog.open) return;
      ignoreCloseRef.current = true;
      dialog.close();
      ignoreCloseRef.current = false;
    };
  }, [term]);

  const close = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else onCloseRef.current();
  };

  return (
    <dialog
      ref={dialogRef}
      className="glossary-dialog"
      aria-labelledby={term ? titleId : undefined}
      aria-describedby={term ? bodyId : undefined}
      onClose={() => {
        if (ignoreCloseRef.current) return;
        onCloseRef.current();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {term ? (
        <div className="glossary-dialog-card" data-glossary-modal="">
          <div className="flex items-start justify-between gap-3">
            <p className="ui-section-label pt-2">用語解説</p>
            <button
              type="button"
              className="glossary-dialog-close"
              aria-label="用語解説を閉じる"
              onClick={close}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <h2
            ref={headingRef}
            id={titleId}
            tabIndex={-1}
            className="font-display mt-2 break-words text-[22px] leading-snug font-black tracking-[-0.03em] text-[var(--ink)]"
          >
            {term.term}
          </h2>
          <p
            id={bodyId}
            className="mt-3 break-words text-[15px] leading-7 text-[var(--ink-soft)]"
          >
            {term.plain}
          </p>
          <button
            type="button"
            className="cta-button mt-5 w-full sm:w-auto"
            onClick={close}
          >
            閉じる
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
