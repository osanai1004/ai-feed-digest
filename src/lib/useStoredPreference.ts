"use client";

import { useCallback, useSyncExternalStore } from "react";

/** 同一タブ内での設定変更を伝えるイベント名（storage イベントは他タブのみのため） */
const PREFERENCE_EVENT = "yoyaku-preference-change";

/**
 * localStorage に保存する単一値の設定（読者タブ・要約の深さなど）を購読するフック。
 * - サーバー描画時はフォールバック値を使い、ハイドレーション後に保存値へ切り替わる
 * - 同一タブは独自イベント、他タブは storage イベントで同期する
 */
export function useStoredPreference<T extends string>(
  key: string,
  isValid: (value: string) => value is T,
  fallback: T,
): [T, (next: T) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) onChange();
      };
      const onLocalChange = (event: Event) => {
        if ((event as CustomEvent<string>).detail === key) onChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(PREFERENCE_EVENT, onLocalChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(PREFERENCE_EVENT, onLocalChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw && isValid(raw)) return raw;
    } catch {
      // localStorage が使えない環境ではフォールバック値
    }
    return fallback;
  }, [key, isValid, fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
        window.dispatchEvent(
          new CustomEvent<string>(PREFERENCE_EVENT, { detail: key }),
        );
      } catch {
        // localStorage が使えない環境では現在の値のまま
      }
    },
    [key],
  );

  return [value, setValue];
}
