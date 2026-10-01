import {
  COARSE_MIN_TEXT_LENGTH,
  COARSE_TOPIC_TERMS,
  INTAKE_MAX_LENGTHS,
  OFFICIAL_CONFIRMATION_NOTE,
} from "./constants";
import { isSafeExternalUrl } from "./safeUrl";
import type { IntakeAction, IntakeStatus } from "./types";

const X_STATUS_PATH = /\/status\/\d+/;

/** x.com / twitter.com 本体とサブドメイン（投稿ページの取得に使わない判定用） */
export function isXHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "x.com" ||
    host === "twitter.com" ||
    host.endsWith(".x.com") ||
    host.endsWith(".twitter.com")
  );
}

/** 浅子が渡す投稿 URL。https のステータス URL だけ通す */
export function isXPostUrl(value: string): boolean {
  if (!isSafeExternalUrl(value)) return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (!isXHost(url.hostname)) return false;
    return X_STATUS_PATH.test(url.pathname);
  } catch {
    return false;
  }
}

/** 記事の一次情報。X の URL は公式ソースにしない */
export function isOfficialPrimaryUrl(value: string): boolean {
  if (!isSafeExternalUrl(value)) return false;
  try {
    const url = new URL(value.trim());
    return !isXHost(url.hostname);
  } catch {
    return false;
  }
}

/** 末尾スラッシュとハッシュを揃えて同一 URL 判定に使う */
export function canonicalHttpUrl(value: string): string | null {
  if (!isSafeExternalUrl(value)) return null;
  const url = new URL(value.trim());
  url.hash = "";
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

export type CoarseFilterReason = "too_short" | "topic_miss";

export function coarseFilterText(text: string): CoarseFilterReason | null {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < COARSE_MIN_TEXT_LENGTH) return "too_short";
  const hit = COARSE_TOPIC_TERMS.some((term) =>
    normalized.includes(term.toLowerCase()),
  );
  if (!hit) return "topic_miss";
  return null;
}

export const FILTER_REASON_LABELS: Record<CoarseFilterReason, string> = {
  too_short: "本文が短すぎます",
  topic_miss: "監視している製品名が含まれないため、確認待ちには入れていません",
};

const DECIDED_STATUSES: IntakeStatus[] = [
  "pending_review",
  "needs_factcheck",
  "ready",
  "memo",
  "ingested",
];

/** 人がまだ判断していない状態なら、再 POST で仕分けし直してよい */
export function canResubmitSignal(status: IntakeStatus): boolean {
  return !DECIDED_STATUSES.includes(status);
}

export type IntakeDecision = {
  status: IntakeStatus;
  officialUrl: string | null;
};

export type XIngestEvidence = "official" | "x";

/**
 * 記事の url と注記。
 * 公式URLがあればそれを url にする。無ければ X の投稿 URL。
 * 「公式もこう言っている」は、公式ページの本文が取れたときだけ付ける。
 */
export function resolveXIngestSource(input: {
  officialUrl: string | null;
  xPostUrl: string;
  officialText: string;
}): { url: string; officialNote: string | null; evidence: XIngestEvidence } {
  const officialUrl = input.officialUrl?.trim() ?? "";
  const usedOfficial = Boolean(officialUrl && input.officialText.trim());
  return {
    url: officialUrl || input.xPostUrl.trim(),
    officialNote: usedOfficial ? OFFICIAL_CONFIRMATION_NOTE : null,
    evidence: usedOfficial ? "official" : "x",
  };
}

/** X記事の url は公式ページか、その候補の投稿 URL だけ */
export function isAllowedXArticleUrl(articleUrl: string, xPostUrl: string): boolean {
  if (isOfficialPrimaryUrl(articleUrl)) return true;
  const article = canonicalHttpUrl(articleUrl);
  const post = canonicalHttpUrl(xPostUrl);
  return Boolean(article && post && article === post);
}

/**
 * 承認済み候補と記事 URL が一致するか。
 * 公式URL付きならそのURL。無ければ投稿URL。
 */
export function articleUrlMatchesApprovedSignal(
  signal: { officialUrl: string | null; xPostUrl: string },
  articleUrl: string,
): boolean {
  const actual = canonicalHttpUrl(articleUrl);
  if (!actual) return false;
  if (signal.officialUrl?.trim()) {
    const expected = canonicalHttpUrl(signal.officialUrl);
    return Boolean(expected && expected === actual);
  }
  const post = canonicalHttpUrl(signal.xPostUrl);
  return Boolean(post && post === actual);
}

function readyDecision(input: {
  officialUrl: string | null;
  xPostUrl?: string | null;
}): { ok: true; decision: IntakeDecision } | { ok: false; error: string } {
  if (input.officialUrl) {
    return {
      ok: true,
      decision: { status: "ready", officialUrl: input.officialUrl },
    };
  }
  if (input.xPostUrl && isXPostUrl(input.xPostUrl)) {
    return { ok: true, decision: { status: "ready", officialUrl: null } };
  }
  return {
    ok: false,
    error: "Ready requires an official URL or an X post URL",
  };
}

/**
 * 人の操作を次の状態に変える。
 * 承認・裏取り解決は要約待ち（ready）にする。
 * 公式 URL が無くても、X の投稿 URL があれば記事にしてよい。
 */
export function applyIntakeAction(input: {
  status: IntakeStatus;
  action: IntakeAction;
  officialUrl: string | null;
  xPostUrl?: string | null;
}): { ok: true; decision: IntakeDecision } | { ok: false; error: string } {
  const { status, action } = input;
  const officialUrl = input.officialUrl;

  if (action === "restore") {
    if (status !== "filtered") {
      return { ok: false, error: "Only filtered signals can be restored" };
    }
    return { ok: true, decision: { status: "pending_review", officialUrl: null } };
  }

  if (action === "reject") {
    if (
      status !== "pending_review" &&
      status !== "needs_factcheck" &&
      status !== "ready" &&
      status !== "filtered"
    ) {
      return { ok: false, error: "This signal can no longer be rejected" };
    }
    return { ok: true, decision: { status: "rejected", officialUrl: null } };
  }

  if (action === "flag_factcheck") {
    if (status !== "pending_review") {
      return {
        ok: false,
        error: "Fact-check flag is only available from pending review",
      };
    }
    return {
      ok: true,
      decision: { status: "needs_factcheck", officialUrl: null },
    };
  }

  if (action === "approve") {
    if (status !== "pending_review") {
      return { ok: false, error: "Approve is only available from pending review" };
    }
    return readyDecision({ officialUrl, xPostUrl: input.xPostUrl });
  }

  if (action === "resolve_factcheck") {
    if (status !== "needs_factcheck") {
      return {
        ok: false,
        error: "Fact-check resolution is only available from needs_factcheck",
      };
    }
    return readyDecision({ officialUrl, xPostUrl: input.xPostUrl });
  }

  return { ok: false, error: "Unknown action" };
}

export function isBoundedIntakeString(
  value: unknown,
  maxLength: number,
): value is string {
  return (
    typeof value === "string" &&
    Boolean(value.trim()) &&
    value.length <= maxLength
  );
}

export function optionalBoundedString(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function titleFromPostText(text: string): string {
  const line = text.trim().split("\n")[0]?.trim() ?? "";
  if (line.length <= INTAKE_MAX_LENGTHS.title) return line;
  return `${line.slice(0, INTAKE_MAX_LENGTHS.title - 1)}…`;
}
