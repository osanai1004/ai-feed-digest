import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import { upsertArticle } from "@/lib/store";
import { isDualSummary, isLegacySummary } from "@/lib/summary";
import type { IngestPayload } from "@/lib/types";

export const runtime = "nodejs";

function isValidPayload(body: unknown): body is IngestPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.source !== "string" || !b.source.trim()) return false;
  if (typeof b.title !== "string" || !b.title.trim()) return false;
  if (typeof b.url !== "string" || !b.url.trim()) return false;
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
