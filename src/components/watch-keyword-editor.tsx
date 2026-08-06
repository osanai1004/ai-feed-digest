"use client";

import { useState } from "react";
import {
  WATCH_KEYWORD_MAX_LENGTH,
  WATCH_KEYWORDS_MAX,
} from "@/lib/constants";
import { libraryActions } from "@/lib/libraryStore";

type Props = {
  keywords: string[];
};

/** ウォッチキーワード（気になる語）の追加・削除フォーム */
export function WatchKeywordEditor({ keywords }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const message = libraryActions.addWatchKeyword(input);
    setError(message);
    if (!message) setInput("");
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="watch-keyword-input">
          ウォッチキーワードを追加
        </label>
        <input
          id="watch-keyword-input"
          type="text"
          value={input}
          maxLength={WATCH_KEYWORD_MAX_LENGTH}
          onChange={(event) => {
            setInput(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="例: Laravel、Claude、MCP…"
          className="ui-search-field"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="ui-action-btn shrink-0 justify-center"
        >
          追加
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] font-bold text-[var(--chip-orange-fg)]">
          {error}
        </p>
      ) : null}

      {keywords.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <li key={keyword}>
              <span className="ui-chip ui-chip-orange gap-1.5">
                {keyword}
                <button
                  type="button"
                  aria-label={`「${keyword}」をウォッチから外す`}
                  onClick={() => libraryActions.removeWatchKeyword(keyword)}
                  className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[12px] font-extrabold transition hover:bg-[var(--card)]"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] leading-5 text-[var(--mute)]">
          登録した語を含む記事に「ウォッチ」の印が付き、一覧で絞り込めます（最大
          {WATCH_KEYWORDS_MAX}件）。
        </p>
      )}
    </div>
  );
}
