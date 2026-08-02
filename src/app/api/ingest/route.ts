import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import { upsertArticle } from "@/lib/store";
import type { IngestPayload } from "@/lib/types";

export const runtime = "nodejs";

function isValidPayload(body: unknown): body is IngestPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.source !== "string" || !b.source.trim()) return false;
  if (typeof b.title !== "string" || !b.title.trim()) return false;
  if (typeof b.url !== "string" || !b.url.trim()) return false;
  if (!b.summary || typeof b.summary !== "object") return false;
  const s = b.summary as Record<string, unknown>;
  if (typeof s.conclusion !== "string") return false;
  if (!Array.isArray(s.situations)) return false;
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
            "Invalid payload. Required: source, title, url, summary.conclusion, summary.situations[]",
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
