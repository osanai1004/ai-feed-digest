import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import { INTAKE_MAX_LENGTHS } from "@/lib/constants";
import { httpError, readErrorMessage, readErrorStatus } from "@/lib/http";
import { optionalBoundedString, readIncomingOfficialUrl } from "@/lib/intake";
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

    let officialUrl: string | null | undefined;
    if (!Object.prototype.hasOwnProperty.call(record, "officialUrl")) {
      officialUrl = undefined;
    } else {
      const parsed = readIncomingOfficialUrl(record.officialUrl);
      if (!parsed.ok) {
        throw httpError(
          "officialUrl must be an http(s) page that is not an X or Twitter URL",
          400,
        );
      }
      officialUrl = parsed.officialUrl;
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
