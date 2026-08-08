"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * 初回保存時に一度だけ表示する、端末内保存の説明ダイアログ。
 * 保存自体は完了済みで、これは説明のみ（操作をブロックしない）。
 */
export function LocalSaveNotice({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="local-save-notice-title"
      className="animate-rise fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl pb-[max(0px,env(safe-area-inset-bottom))]"
    >
      <div className="ui-card p-5 shadow-[var(--shadow-hover)] sm:p-6">
        <h2
          id="local-save-notice-title"
          className="font-display text-[16px] font-bold"
        >
          この端末・このブラウザにだけ保存されます
        </h2>
        <ul className="mt-3 grid gap-1.5 text-[13px] leading-6 text-[var(--body)]">
          <li>・ログイン同期はされず、別の端末・ブラウザには引き継がれません。</li>
          <li>
            ・ブラウザの閲覧データ削除やシークレットモードの終了で消えることがあります。
          </li>
          <li>・重要な記事は、原文URLのブックマークも併用してください。</li>
        </ul>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="cta-button w-full sm:w-auto"
          >
            わかりました
          </button>
          <Link
            href="/library"
            className="text-center text-[13px] font-bold text-[var(--accent)] underline-offset-4 hover:underline sm:text-left"
            onClick={onClose}
          >
            バックアップと保存データの管理 →
          </Link>
        </div>
      </div>
    </div>
  );
}
