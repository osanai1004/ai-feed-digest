"use client";

import { useEffect, useState } from "react";
import { AudienceTabs } from "@/components/ui/audience-tabs";
import {
  AUDIENCE_VOICE_STORAGE_KEY,
  DEFAULT_AUDIENCE_VOICE,
  type AudienceVoiceSlug,
} from "@/lib/constants";
import { getAudienceSummary } from "@/lib/summary";
import type { ArticleSummary } from "@/lib/types";

type Props = {
  summary: ArticleSummary;
};

function isAudienceVoice(value: string): value is AudienceVoiceSlug {
  return value === "general" || value === "engineer";
}

export function ArticleAudiencePanel({ summary }: Props) {
  const [voice, setVoice] = useState<AudienceVoiceSlug>(DEFAULT_AUDIENCE_VOICE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(AUDIENCE_VOICE_STORAGE_KEY);
      if (saved && isAudienceVoice(saved)) {
        setVoice(saved);
      }
    } catch {
      // localStorage が使えない環境では初期値のまま
    }
  }, []);

  function handleChange(next: AudienceVoiceSlug) {
    setVoice(next);
    try {
      window.localStorage.setItem(AUDIENCE_VOICE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const content = getAudienceSummary(summary, voice);

  return (
    <div className="mt-8">
      <AudienceTabs value={voice} onChange={handleChange} />
      <p className="mt-3 text-[13px] leading-6 text-[var(--body)]">
        {voice === "general"
          ? "専門用語をかみ砕いて、仕事で使える言い方にしています。"
          : "正確な用語で、実装・運用への影響が分かる書き方にしています。"}
      </p>

      <section className="ui-panel mt-5 rounded-3xl p-5 sm:p-6">
        <h2 className="mb-3 text-[12px] font-extrabold tracking-[0.14em] text-[var(--chip-teal-fg)] uppercase">
          結論
        </h2>
        <div className="whitespace-pre-line text-[17px] leading-8 text-[var(--ink-soft)]">
          {content.conclusion}
        </div>
      </section>

      {content.terms.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-4 text-[12px] font-extrabold tracking-[0.14em] text-[var(--chip-sky-fg)] uppercase">
            用語ひとこと
          </h2>
          <ul className="grid gap-2">
            {content.terms.map((item) => (
              <li
                key={`${voice}-${item.term}`}
                className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] px-4 py-3"
              >
                <p className="text-[14px] leading-6 text-[var(--ink-soft)]">
                  <span className="font-extrabold text-[var(--ink)]">
                    {item.term}
                  </span>
                  <span className="text-[var(--mute)]"> … </span>
                  {item.plain}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-4 text-[12px] font-extrabold tracking-[0.14em] text-[var(--chip-orange-fg)] uppercase">
          使えるシチュエーション
        </h2>
        <ol className="grid gap-3">
          {content.situations.map((item, index) => (
            <li
              key={`${voice}-${index}-${item}`}
              className="flex gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] p-4"
            >
              <span className="ui-source-bar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold text-white">
                {index + 1}
              </span>
              <span className="pt-1 text-[15px] leading-7 text-[var(--ink-soft)]">
                {item}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
