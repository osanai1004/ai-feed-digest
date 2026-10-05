import { NextResponse } from "next/server";
import { assertIngestAuthorized } from "@/lib/auth";
import {
  INTAKE_MAX_ITEMS,
  INTAKE_MAX_LENGTHS,
  X_METRICS_REFRESH_WINDOW_CAP,
} from "@/lib/constants";
import { httpError, readErrorMessage, readErrorStatus } from "@/lib/http";
import {
  FILTER_REASON_LABELS,
  isBoundedIntakeString,
  isXPostUrl,
  optionalBoundedString,
  readIncomingOfficialUrl,
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
import {
  decideMetricRefresh,
  readMetricsRefreshWindowDays,
  readXMetricPatch,
} from "@/lib/xMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isListFilter(value: string): value is SignalListFilter {
  return (
    value === "all" ||
    value === "queue" ||
    (INTAKE_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * 認証を通過したこの POST だけの公開日ウィンドウ。
 * 省略時は undefined で、decideMetricRefresh の既定（14日）のまま。
 */
function readRequestMetricsWindowDays(body: unknown): number | undefined {
  if (!body || typeof body !== "object") return undefined;
  const parsed = readMetricsRefreshWindowDays(
    (body as Record<string, unknown>).metricsRefreshWindowDays,
  );
  if (!parsed.ok) {
    throw httpError(
      `metricsRefreshWindowDays must be an integer from 1 to ${X_METRICS_REFRESH_WINDOW_CAP}`,
      400,
    );
  }
  return parsed.days;
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
  const official = readIncomingOfficialUrl(item.officialUrl);
  if (!official.ok) {
    throw httpError(
      "officialUrl must be an http(s) page that is not an X or Twitter URL",
      400,
    );
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
    officialUrl: official.officialUrl,
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
    const windowDays = readRequestMetricsWindowDays(body);
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
          windowDays,
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
