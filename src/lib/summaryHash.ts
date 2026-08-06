import type { ArticleSummary, AudienceSummary } from "./types";

/**
 * 要約の更新検知用ハッシュ。
 * JSON のキー順に依存しないよう、フィールドを固定順で連結してから計算する。
 * サーバー・クライアント両方で同じ結果になる純粋関数。
 */

function hashString(input: string): string {
  // makeId と同系の djb2 風ハッシュ（衝突耐性より軽さを優先。更新検知用途には十分）
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
    hash |= 0;
  }
  return `h_${(hash >>> 0).toString(36)}`;
}

function voiceFingerprint(voice: AudienceSummary): string {
  return [
    voice.conclusion,
    voice.situations.join("\u0001"),
    voice.terms.map((t) => `${t.term}\u0002${t.plain}`).join("\u0001"),
  ].join("\u0003");
}

export function summaryHash(summary: ArticleSummary): string {
  return hashString(
    [voiceFingerprint(summary.general), voiceFingerprint(summary.engineer)].join(
      "\u0004",
    ),
  );
}
