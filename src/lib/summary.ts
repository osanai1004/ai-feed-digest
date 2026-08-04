import { normalizeMultilineText } from "./text";
import type {
  ArticleSummary,
  AudienceSummary,
  AudienceVoice,
  ArticleTerm,
  LegacyArticleSummary,
} from "./types";

function normalizeTerm(raw: unknown): ArticleTerm | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const term = typeof t.term === "string" ? t.term.trim() : "";
  const plain = typeof t.plain === "string" ? t.plain.trim() : "";
  if (!term || !plain) return null;
  return {
    term,
    plain: normalizeMultilineText(plain).replace(/\s*\n+\s*/g, " ").trim(),
  };
}

function normalizeSituations(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [];
  const situations = list
    .filter(Boolean)
    .map((s) => normalizeMultilineText(String(s)).trim())
    .filter(Boolean)
    .slice(0, 3);
  while (situations.length < 3) {
    situations.push("（シチュエーション未入力）");
  }
  return situations;
}

function normalizeTerms(raw: unknown): ArticleTerm[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeTerm)
    .filter((t): t is ArticleTerm => Boolean(t))
    .slice(0, 8);
}

function conclusionToText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((line) =>
        normalizeMultilineText(String(line))
          .replace(/\s*\n+\s*/g, " ")
          .trim(),
      )
      .filter(Boolean)
      .slice(0, 5)
      .join("\n");
  }
  return normalizeMultilineText(String(value ?? "")).trim();
}

export function normalizeAudienceSummary(
  raw: Partial<AudienceSummary> | null | undefined,
): AudienceSummary {
  return {
    conclusion: conclusionToText(raw?.conclusion) || "（結論未入力）",
    situations: normalizeSituations(raw?.situations),
    terms: normalizeTerms(raw?.terms),
  };
}

export function isLegacySummary(
  summary: unknown,
): summary is LegacyArticleSummary {
  if (!summary || typeof summary !== "object") return false;
  const s = summary as Record<string, unknown>;
  return (
    typeof s.conclusion === "string" &&
    Array.isArray(s.situations) &&
    !("general" in s) &&
    !("engineer" in s)
  );
}

export function isDualSummary(summary: unknown): summary is ArticleSummary {
  if (!summary || typeof summary !== "object") return false;
  const s = summary as Record<string, unknown>;
  return (
    Boolean(s.general) &&
    typeof s.general === "object" &&
    Boolean(s.engineer) &&
    typeof s.engineer === "object"
  );
}

/** 旧1ボイスを両ボイスへ展開（既存データ互換） */
export function dualFromLegacy(
  conclusion: string,
  situations: unknown,
  terms: unknown = [],
): ArticleSummary {
  const voice = normalizeAudienceSummary({
    conclusion,
    situations: Array.isArray(situations)
      ? situations.map(String)
      : [],
    terms: normalizeTerms(terms),
  });
  return {
    general: voice,
    engineer: {
      conclusion: voice.conclusion,
      situations: [...voice.situations],
      terms: voice.terms.map((t) => ({ ...t })),
    },
  };
}

export function normalizeArticleSummary(
  summary: ArticleSummary | LegacyArticleSummary | unknown,
): ArticleSummary {
  if (isDualSummary(summary)) {
    return {
      general: normalizeAudienceSummary(summary.general),
      engineer: normalizeAudienceSummary(summary.engineer),
    };
  }
  if (isLegacySummary(summary)) {
    return dualFromLegacy(summary.conclusion, summary.situations);
  }
  return dualFromLegacy("（結論未入力）", []);
}

export function getAudienceSummary(
  summary: ArticleSummary,
  voice: AudienceVoice,
): AudienceSummary {
  return summary[voice];
}
