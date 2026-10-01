import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import { INTAKE_MAX_LENGTHS } from "@/lib/constants";
import { httpError, readErrorMessage, readErrorStatus } from "@/lib/http";
import { isOfficialPrimaryUrl, optionalBoundedString } from "@/lib/intake";
import { decideSignal } from "@/lib/store";
import { INTAKE_ACTIONS, type IntakeAction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNAL_ID = /^s_[a-f0-9]{16}$/;

function isAction(value: unknown): value is IntakeAction {
  return (
    typeof value === "string" &&
    (INTAKE_ACTIONS as readonly string[]).includes(value)
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertIngestAuthorized(request);
    const { id } = await params;
    if (!SIGNAL_ID.test(id)) throw httpError("Signal not found", 404);

    const body = await request.json();
    if (!body || typeof body !== "object") throw httpError("Invalid payload", 400);
    const record = body as Record<string, unknown>;
    if (!isAction(record.action)) throw httpError("Unknown action", 400);

    const actor = optionalBoundedString(record.actor, INTAKE_MAX_LENGTHS.actor);
    const note = optionalBoundedString(record.note, INTAKE_MAX_LENGTHS.note);
    if (actor === undefined || note === undefined) {
      throw httpError("actor or note is too long", 400);
    }

    let officialUrl: string | null = null;
    if (record.officialUrl != null && record.officialUrl !== "") {
      if (typeof record.officialUrl !== "string") {
        throw httpError("officialUrl must be a URL string", 400);
      }
      const trimmed = record.officialUrl.trim();
      if (trimmed.length > INTAKE_MAX_LENGTHS.url || !isOfficialPrimaryUrl(trimmed)) {
        throw httpError(
          "officialUrl must be an http(s) page that is not an X or Twitter URL",
          400,
        );
      }
      officialUrl = trimmed;
    }

    const signal = await decideSignal({
      id,
      action: record.action,
      officialUrl,
      note,
      actor,
    });
    return NextResponse.json({ ok: true, signal });
  } catch (error) {
    const status = readErrorStatus(error);
    if (status >= 500) console.error("intake decision failed:", error);
    return NextResponse.json(
      { error: readErrorMessage(error, status) },
      { status },
    );
  }
}
