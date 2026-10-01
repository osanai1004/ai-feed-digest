import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import { INGEST_MAX_LENGTHS } from "@/lib/constants";
import { readErrorMessage, readErrorStatus } from "@/lib/http";
import { isAllowedXArticleUrl, isXPostUrl } from "@/lib/intake";
import { isSafeExternalUrl } from "@/lib/safeUrl";
import { markSignalIngested, upsertArticle } from "@/lib/store";
import { isDualSummary, isLegacySummary, summaryExplainsContent } from "@/lib/summary";
import type { IngestPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNAL_ID = /^s_[a-f0-9]{16}$/;

function isBoundedString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    Boolean(value.trim()) &&
    value.length <= maxLength
  );
}

function isConclusionField(value: unknown): boolean {
  return (
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function readProvenance(
  body: Record<string, unknown>,
  articleUrl: string,
): Pick<IngestPayload, "origin" | "xPostUrl" | "officialNote" | "signalId"> | null {
  const origin = body.origin;
  const hasXFields =
    body.xPostUrl != null ||
    body.signalId != null ||
    (body.officialNote != null && body.officialNote !== "") ||
    origin === "x";

  if (!hasXFields) {
    if (origin != null && origin !== "rss") return null;
    return { origin: "rss" };
  }

  if (origin !== "x") return null;
  if (!isBoundedString(body.xPostUrl, INGEST_MAX_LENGTHS.xPostUrl)) return null;
  if (!isXPostUrl(body.xPostUrl.trim())) return null;
  if (!isAllowedXArticleUrl(articleUrl, body.xPostUrl.trim())) return null;

  if (typeof body.signalId !== "string" || !SIGNAL_ID.test(body.signalId)) {
    return null;
  }
  const signalId = body.signalId;

  let officialNote: string | undefined;
  if (body.officialNote != null && body.officialNote !== "") {
    if (!isBoundedString(body.officialNote, INGEST_MAX_LENGTHS.officialNote)) {
      return null;
    }
    officialNote = body.officialNote.trim();
  }

  return {
    origin: "x",
    xPostUrl: body.xPostUrl.trim(),
    officialNote,
    signalId,
  };
}

function isValidPayload(body: unknown): body is IngestPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!isBoundedString(b.source, INGEST_MAX_LENGTHS.source)) return false;
  if (!isBoundedString(b.title, INGEST_MAX_LENGTHS.title)) return false;
  if (!isBoundedString(b.url, INGEST_MAX_LENGTHS.url)) return false;
  // javascript: 等のスキームを保存させない（保存型 XSS 対策）
  if (!isSafeExternalUrl(b.url.trim())) return false;
  if (!b.summary || typeof b.summary !== "object") return false;

  const summaryOk = isLegacySummary(b.summary)
    ? true
    : isDualSummary(b.summary) &&
      isConclusionField((b.summary.general as Record<string, unknown>).conclusion) &&
      Array.isArray((b.summary.general as Record<string, unknown>).situations) &&
      isConclusionField((b.summary.engineer as Record<string, unknown>).conclusion) &&
      Array.isArray((b.summary.engineer as Record<string, unknown>).situations);
  if (!summaryOk) return false;
  if (!summaryExplainsContent(b.title.trim(), b.summary)) return false;

  const provenance = readProvenance(b, b.url.trim());
  if (!provenance) return false;
  return true;
}

export async function POST(request: Request) {
  try {
    assertIngestAuthorized(request);
    const body = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Required: source, title, url, and a summary that explains the content (not the title alone). X articles need origin=x, xPostUrl, signalId, and url set to an official page or that X post.",
        },
        { status: 400 },
      );
    }

    const provenance = readProvenance(body, body.url.trim());
    const article = await upsertArticle({
      ...body,
      ...provenance,
    });
    if (provenance?.signalId) {
      await markSignalIngested(provenance.signalId, article.id, article.url);
    }
    return NextResponse.json({ ok: true, article }, { status: 201 });
  } catch (error) {
    const status = readErrorStatus(error);
    const message = readErrorMessage(error, status);
    if (status >= 500) {
      console.error("ingest failed:", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
