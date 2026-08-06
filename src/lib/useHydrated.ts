"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * ハイドレーション（SSRのHTMLとクライアント初期描画の一致処理）完了後に true。
 * useEffect + setState を使わずに済む、lint 推奨の判定方法。
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
