/** 外部リンクとして許可する URL スキーム（javascript: 等による XSS を防ぐ） */
const ALLOWED_URL_PROTOCOLS = ["http:", "https:"] as const;

/**
 * RSS 由来など外部入力の URL を <a href> に出してよいか判定する。
 * http / https 以外（javascript: / data: など）は拒否する。
 */
export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (ALLOWED_URL_PROTOCOLS as readonly string[]).includes(url.protocol);
  } catch {
    return false;
  }
}

/** 表示用: 安全な URL のみ返し、それ以外は null */
export function safeExternalUrl(value: string): string | null {
  return isSafeExternalUrl(value) ? value : null;
}
