import { postOrder, type PickupCandidate } from "./rank.ts";

export type IntakeWireItem = {
  xPostUrl: string;
  text: string;
  source: string;
  author?: string;
  title?: string;
  publishedAt?: string;
  officialUrl?: string;
  impressions?: number;
  reposts?: number;
  likes?: number;
};

export type PostedSignal = {
  id: string;
  status: string;
  duplicate: boolean;
  officialUrl: string | null;
  xPostUrl: string;
};

export type DeliveryReport = {
  posted: number;
  duplicates: number;
  pendingReview: number;
  filtered: number;
  approved: number;
  signals: PostedSignal[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function toIntakeItem(candidate: PickupCandidate): IntakeWireItem {
  const item: IntakeWireItem = {
    xPostUrl: candidate.xPostUrl,
    text: candidate.text,
    source: candidate.source,
    title: candidate.title,
    publishedAt: candidate.publishedAt,
  };
  if (candidate.author) item.author = candidate.author;
  if (candidate.officialUrl) item.officialUrl = candidate.officialUrl;
  if (candidate.impressions != null) item.impressions = candidate.impressions;
  if (candidate.reposts != null) item.reposts = candidate.reposts;
  if (candidate.likes != null) item.likes = candidate.likes;
  return item;
}

async function readError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return `intake failed: ${response.status}`;
}

export async function postIntakeItem(options: {
  baseUrl: string;
  secret: string;
  item: IntakeWireItem;
  fetchImpl?: typeof fetch;
}): Promise<PostedSignal> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${options.baseUrl}/api/intake`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options.item),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body: unknown = await response.json();
  const signals =
    body && typeof body === "object" && Array.isArray((body as { signals?: unknown }).signals)
      ? (body as { signals: unknown[] }).signals
      : [];
  const signal = signals[0];
  if (!signal || typeof signal !== "object") throw new Error("intake response missing signal");
  const record = signal as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.xPostUrl !== "string") {
    throw new Error("intake response missing signal");
  }
  return {
    id: record.id,
    status: typeof record.status === "string" ? record.status : "",
    duplicate: record.duplicate === true,
    officialUrl: typeof record.officialUrl === "string" ? record.officialUrl : null,
    xPostUrl: record.xPostUrl,
  };
}

export async function approveSignal(options: {
  baseUrl: string;
  secret: string;
  id: string;
  officialUrl: string | null;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const payload: Record<string, string> = {
    action: "approve",
    actor: "x-pickup",
  };
  if (options.officialUrl) payload.officialUrl = options.officialUrl;
  const response = await fetchImpl(`${options.baseUrl}/api/intake/${options.id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
}

/**
 * バズの低い候補から POST する。
 * 一覧と GAS は作成が新しい順なので、最後に送った一番バズっている候補が先頭に来る。
 * autoApprove は、この実行で新規に pending_review になったものだけ ready にする。
 */
export async function deliverCandidates(options: {
  baseUrl: string;
  secret: string;
  candidates: readonly PickupCandidate[];
  autoApprove: boolean;
  fetchImpl?: typeof fetch;
  pause?: (ms: number) => Promise<void>;
}): Promise<DeliveryReport> {
  const pause = options.pause ?? sleep;
  const report: DeliveryReport = {
    posted: 0,
    duplicates: 0,
    pendingReview: 0,
    filtered: 0,
    approved: 0,
    signals: [],
  };
  const ordered = postOrder(options.candidates);
  for (let index = 0; index < ordered.length; index += 1) {
    const candidate = ordered[index];
    const saved = await postIntakeItem({
      baseUrl: options.baseUrl,
      secret: options.secret,
      item: toIntakeItem(candidate),
      fetchImpl: options.fetchImpl,
    });
    report.posted += 1;
    report.signals.push(saved);
    if (saved.duplicate) report.duplicates += 1;
    if (saved.status === "filtered") report.filtered += 1;
    if (
      options.autoApprove &&
      !saved.duplicate &&
      saved.status === "pending_review"
    ) {
      await approveSignal({
        baseUrl: options.baseUrl,
        secret: options.secret,
        id: saved.id,
        officialUrl: saved.officialUrl ?? candidate.officialUrl,
        fetchImpl: options.fetchImpl,
      });
      saved.status = "ready";
      report.approved += 1;
    } else if (saved.status === "pending_review") {
      report.pendingReview += 1;
    }
    if (index < ordered.length - 1) await pause(30);
  }
  return report;
}
