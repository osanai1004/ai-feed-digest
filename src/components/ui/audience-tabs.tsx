"use client";

import {
  AUDIENCE_VOICES,
  type AudienceVoiceSlug,
} from "@/lib/constants";

type Props = {
  value: AudienceVoiceSlug;
  onChange: (voice: AudienceVoiceSlug) => void;
};

export function AudienceTabs({ value, onChange }: Props) {
  return (
    <div
      className="ui-audience-tabs"
      role="tablist"
      aria-label="読み方を選ぶ"
    >
      {AUDIENCE_VOICES.map((voice) => {
        const selected = value === voice.slug;
        return (
          <button
            key={voice.slug}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`ui-audience-tab${selected ? " is-active" : ""}`}
            onClick={() => onChange(voice.slug)}
          >
            {voice.label}
          </button>
        );
      })}
    </div>
  );
}
