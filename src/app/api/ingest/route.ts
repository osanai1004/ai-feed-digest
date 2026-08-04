import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import { INGEST_MAX_LENGTHS } from "@/lib/constants";
import { isSafeExternalUrl } from "@/lib/safeUrl";
import { upsertArticle } from "@/lib/store";
import { isDualSummary, isLegacySummary } from "@/lib/summary";
import type { IngestPayload } from "@/lib/types";

export const runtime = "nodejs";

function isBoundedString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    Boolean(value.trim()) &&
    value.length <= maxLength
  );
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

  if (isLegacySummary(b.summary)) return true;
  if (!isDualSummary(b.summary)) return false;

  const general = b.summary.general as Record<string, unknown>;
  const engineer = b.summary.engineer as Record<string, unknown>;
  if (!isConclusionField(general.conclusion)) return false;
  if (!Array.isArray(general.situations)) return false;
  if (!isConclusionField(engineer.conclusion)) return false;
  if (!Array.isArray(engineer.situations)) return false;
  return true;
}

function isConclusionField(value: unknown): boolean {
  return (
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

export async function POST(request: Request) {
  try {
    assertIngestAuthorized(request);
    const body = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Required: source, title, url, summary.general|summary.engineer (or legacy summary.conclusion + situations[])",
        },
        { status: 400 },
      );
    }

    const article = await upsertArticle(body);
    return NextResponse.json({ ok: true, article }, { status: 201 });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    // 想定内エラー（401 など status 付き）以外は内部情報を返さない
    const message =
      status < 500 && error instanceof Error
        ? error.message
        : "Internal server error";
    if (status >= 500) {
      console.error("ingest failed:", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
