/** Gemini / JSON 経由で紛れ込むリテラル \\n を実改行へ直す */
export function normalizeMultilineText(value: string): string {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\r\n/g, "\n");
}

/** 一覧カード用に1行へ畳む */
export function toSingleLine(value: string): string {
  return normalizeMultilineText(value).replace(/\s*\n+\s*/g, " ").trim();
}
