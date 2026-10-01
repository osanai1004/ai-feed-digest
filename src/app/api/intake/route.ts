import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import {
  INTAKE_MAX_ITEMS,
  INTAKE_MAX_LENGTHS,
} from "@/lib/constants";
import { httpError, readErrorMessage, readErrorStatus } from "@/lib/http";
import {
  FILTER_REASON_LABELS,
  isBoundedIntakeString,
  isXPostUrl,
  optionalBoundedString,
  titleFromPostText,
  type CoarseFilterReason,
} from "@/lib/intake";
import {
  listSignals,
  refreshStoredXMetrics,
  saveIncomingSignal,
  type IncomingSignalDraft,
  type SignalListFilter,
} from "@/lib/store";
import { INTAKE_STATUSES } from "@/lib/types";
import { decideMetricRefresh, readXMetricPatch } from "@/lib/xMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isListFilter(value: string): value is SignalListFilter {
  return (
    value === "all" ||
    value === "queue" ||
    (INTAKE_STATUSES as readonly string[]).includes(value)
  );
}

function readItems(body: unknown): unknown[] {
  if (!body || typeof body !== "object") {
    throw httpError("Invalid payload", 400);
  }
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.items)) {
    if (record.items.length === 0 || record.items.length > INTAKE_MAX_ITEMS) {
      throw httpError(`items must contain 1 to ${INTAKE_MAX_ITEMS} candidates`, 400);
    }
    return record.items;
  }
  if (typeof record.xPostUrl === "string") return [record];
  throw httpError("Invalid payload. Required: items[] or xPostUrl + text", 400);
}

function parseDraft(raw: unknown): IncomingSignalDraft {
  if (!raw || typeof raw !== "object") {
    throw httpError("Each item must be an object", 400);
  }
  const item = raw as Record<string, unknown>;
  if (!isBoundedIntakeString(item.xPostUrl, INTAKE_MAX_LENGTHS.url)) {
    throw httpError("xPostUrl is required", 400);
  }
  if (!isXPostUrl(item.xPostUrl.trim())) {
    throw httpError("xPostUrl must be an https X or Twitter status URL", 400);
  }
  if (!isBoundedIntakeString(item.text, INTAKE_MAX_LENGTHS.text)) {
    throw httpError("text is required", 400);
  }

  const source = optionalBoundedString(item.source, INTAKE_MAX_LENGTHS.source);
  const author = optionalBoundedString(item.author, INTAKE_MAX_LENGTHS.author);
  const title = optionalBoundedString(item.title, INTAKE_MAX_LENGTHS.title);
  if (source === undefined || author === undefined || title === undefined) {
    throw httpError("source, author, or title is too long", 400);
  }

  let publishedAt = new Date().toISOString();
  if (item.publishedAt != null && item.publishedAt !== "") {
    if (typeof item.publishedAt !== "string") {
      throw httpError("publishedAt must be an ISO date string", 400);
    }
    const parsed = new Date(item.publishedAt);
    if (Number.isNaN(parsed.getTime())) {
      throw httpError("publishedAt must be an ISO date string", 400);
    }
    publishedAt = parsed.toISOString();
  }

  return {
    xPostUrl: item.xPostUrl.trim(),
    source: source ?? "X",
    author,
    title: title ?? titleFromPostText(item.text),
    body: item.text.trim(),
    publishedAt,
    metrics: readXMetricPatch(item),
  };
}

export async function GET(request: Request) {
  try {
    assertIngestAuthorized(request);
    const status = new URL(request.url).searchParams.get("status") ?? "queue";
    if (!isListFilter(status)) {
      return NextResponse.json(
        { error: "Unknown status filter" },
        { status: 400 },
      );
    }
    const signals = await listSignals(status);
    return NextResponse.json({ count: signals.length, signals });
  } catch (error) {
    const status = readErrorStatus(error);
    if (status >= 500) console.error("intake list failed:", error);
    return NextResponse.json(
      { error: readErrorMessage(error, status) },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    assertIngestAuthorized(request);
    const body = await request.json();
    const drafts = readItems(body).map(parseDraft);
    const saved = [];
    let refreshed = 0;
    const now = new Date();
    for (const draft of drafts) {
      const result = await saveIncomingSignal(draft);
      let signal = result.signal;
      let metricsUpdated = false;
      if (result.duplicate) {
        const decision = decideMetricRefresh({
          publishedAt: result.signal.publishedAt,
          patch: draft.metrics,
          now,
          refreshedSoFar: refreshed,
        });
        if (decision === "refresh") {
          signal = await refreshStoredXMetrics(result.signal, draft.metrics);
          refreshed += 1;
          metricsUpdated = true;
        }
      }
      const reason = signal.filterReason as CoarseFilterReason | null;
      saved.push({
        ...signal,
        duplicate: result.duplicate,
        metricsUpdated,
        filterLabel: reason ? FILTER_REASON_LABELS[reason] : null,
      });
    }
    return NextResponse.json({ ok: true, signals: saved }, { status: 201 });
  } catch (error) {
    const status = readErrorStatus(error);
    if (status >= 500) console.error("intake create failed:", error);
    return NextResponse.json(
      { error: readErrorMessage(error, status) },
      { status },
    );
  }
}
