"use client";

import { useState } from "react";
import { GlossaryModal } from "@/components/glossary-modal";
import { GlossaryText } from "@/components/glossary-text";
import { AudienceTabs } from "@/components/ui/audience-tabs";
import {
  AUDIENCE_VOICE_STORAGE_KEY,
  DEFAULT_AUDIENCE_VOICE,
  DEFAULT_READ_DEPTH,
  READ_DEPTH_STORAGE_KEY,
  READ_DEPTHS,
  type AudienceVoiceSlug,
  type ReadDepthSlug,
} from "@/lib/constants";
import { markGlossaryBlocks } from "@/lib/glossaryMark";
import { getAudienceSummary } from "@/lib/summary";
import { useStoredPreference } from "@/lib/useStoredPreference";
import type { ArticleSummary, ArticleTerm } from "@/lib/types";

type Props = {
  summary: ArticleSummary;
};

function isAudienceVoice(value: string): value is AudienceVoiceSlug {
  return value === "general" || value === "engineer";
}

function isReadDepth(value: string): value is ReadDepthSlug {
  return READ_DEPTHS.some((depth) => depth.slug === value);
}

export function ArticleAudiencePanel({ summary }: Props) {
  const [voice, handleChange] = useStoredPreference(
    AUDIENCE_VOICE_STORAGE_KEY,
    isAudienceVoice,
    DEFAULT_AUDIENCE_VOICE,
  );
  const [depth, handleDepthChange] = useStoredPreference(
    READ_DEPTH_STORAGE_KEY,
    isReadDepth,
    DEFAULT_READ_DEPTH,
  );
  const [activeTerm, setActiveTerm] = useState<ArticleTerm | null>(null);

  const content = getAudienceSummary(summary, voice);
  const quick = depth === "quick";
  const hasDetail = Boolean(content.detail.trim());
  const visibleBlocks = [
    content.conclusion,
    ...(!quick && hasDetail ? [content.detail] : []),
    ...(!quick ? content.situations : []),
  ];
  const markedBlocks = markGlossaryBlocks(visibleBlocks, content.terms);
  let blockIndex = 0;
  const conclusionSegments = markedBlocks[blockIndex] ?? [];
  blockIndex += 1;
  const detailSegments =
    !quick && hasDetail ? markedBlocks[blockIndex++] ?? [] : null;
  const situationSegments = !quick ? markedBlocks.slice(blockIndex) : [];
  const visibleTerm =
    activeTerm &&
    content.terms.some(
      (item) => item.term === activeTerm.term && item.plain === activeTerm.plain,
    )
      ? activeTerm
      : null;

  const handleVoiceChange = (next: AudienceVoiceSlug) => {
    setActiveTerm(null);
    handleChange(next);
  };

  return (
    <div className="mt-6">
      <AudienceTabs value={voice} onChange={handleVoiceChange} />
      <p className="mt-3 text-[13px] leading-6 text-[var(--body)]">
        {voice === "general"
          ? "専門用語をかみ砕いて、仕事で使える言い方にしています。"
          : "正確な用語で、実装・運用への影響が分かる書き方にしています。"}
      </p>

      <div
        className="ui-audience-tabs mt-4"
        role="tablist"
        aria-label="要約の深さを選ぶ"
      >
        {READ_DEPTHS.map((item) => {
          const selected = depth === item.slug;
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`ui-audience-tab${selected ? " is-active" : ""}`}
              onClick={() => handleDepthChange(item.slug)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <section className="ui-panel mt-5 rounded-[var(--radius-card)] border border-[var(--hairline)] p-4 sm:p-5">
        <h2 className="ui-section-label mb-2.5 text-[var(--accent-strong)]">
          結論
        </h2>
        <GlossaryText
          as="div"
          className="whitespace-pre-line text-[16px] leading-7 text-[var(--ink-soft)] sm:text-[17px]"
          segments={conclusionSegments}
          activeTerm={visibleTerm?.term ?? null}
          onOpen={setActiveTerm}
        />
      </section>

      {quick ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[13px] leading-6 text-[var(--body)]">
            詳細内容と使いどころは「詳しく読む」で表示されます。
          </p>
          <button
            type="button"
            onClick={() => handleDepthChange("deep")}
            className="ui-action-btn"
          >
            詳しく読む →
          </button>
        </div>
      ) : null}

      {!quick && hasDetail ? (
        <section className="ui-panel mt-4 rounded-[var(--radius-card)] border border-[var(--hairline)] p-4 sm:p-5">
          <h2 className="ui-section-label mb-2.5">詳細内容</h2>
          <GlossaryText
            as="div"
            className="whitespace-pre-line text-[15px] leading-7 text-[var(--ink-soft)]"
            segments={detailSegments ?? []}
            activeTerm={visibleTerm?.term ?? null}
            onOpen={setActiveTerm}
          />
        </section>
      ) : null}

      {!quick && !hasDetail ? (
        <p className="mt-4 text-[12px] leading-5 text-[var(--mute)]">
          この記事にはまだ詳細内容がありません。今後の取り込み・再要約で追加されます。
        </p>
      ) : null}

      {!quick ? (
        <section className="mt-6">
          <h2 className="ui-section-label mb-4">使えるシチュエーション</h2>
          <ol className="grid gap-3">
            {content.situations.map((item, index) => (
              <li
                key={`${voice}-${index}-${item}`}
                className="flex gap-3 border-b border-[var(--hairline)] pb-3 last:border-b-0 last:pb-0"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[12px] font-extrabold text-[var(--accent-strong)]">
                  {index + 1}
                </span>
                <GlossaryText
                  className="min-w-0 flex-1 break-words pt-0.5 text-[15px] leading-6 text-[var(--ink-soft)]"
                  segments={situationSegments[index] ?? []}
                  activeTerm={visibleTerm?.term ?? null}
                  onOpen={setActiveTerm}
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <GlossaryModal term={visibleTerm} onClose={() => setActiveTerm(null)} />
    </div>
  );
}
