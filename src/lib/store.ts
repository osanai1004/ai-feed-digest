import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { INTAKE_QUEUE_STATUSES } from "./constants";
import { httpError } from "./http";
import {
  applyIntakeAction,
  articleUrlMatchesApprovedSignal,
  canonicalHttpUrl,
  canResubmitSignal,
  coarseFilterText,
} from "./intake";
import {
  applyXMetricRefresh,
  emptyXMetrics,
  hasXMetricPatch,
  mergeXMetrics,
  patchFromCounts,
  readMetricCount,
  type XMetricCounts,
  type XMetricPatch,
} from "./xMetrics";
import { SEED_ARTICLES } from "./seed";
import { normalizeArticleSummary } from "./summary";
import type {
  Article,
  IngestPayload,
  IntakeAction,
  IntakeSignal,
  IntakeStatus,
} from "./types";
import { INTAKE_STATUSES } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");
const SIGNALS_FILE = path.join(DATA_DIR, "signals.json");

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

async function ensureSchema() {
  const sql = sqlClient();
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      published_at TIMESTAMPTZ,
      conclusion TEXT NOT NULL,
      situations JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS summary_json JSONB
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'rss'
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS x_post_url TEXT
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS official_note TEXT
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS impressions INTEGER
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS reposts INTEGER
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS likes INTEGER
  `;
  await sql`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMPTZ
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS intake_signals (
      id TEXT PRIMARY KEY,
      x_post_url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      author TEXT,
      published_at TIMESTAMPTZ,
      status TEXT NOT NULL,
      filter_reason TEXT,
      official_url TEXT,
      factcheck_note TEXT,
      article_id TEXT,
      updated_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE intake_signals
    ADD COLUMN IF NOT EXISTS impressions INTEGER
  `;
  await sql`
    ALTER TABLE intake_signals
    ADD COLUMN IF NOT EXISTS reposts INTEGER
  `;
  await sql`
    ALTER TABLE intake_signals
    ADD COLUMN IF NOT EXISTS likes INTEGER
  `;
  await sql`
    ALTER TABLE intake_signals
    ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMPTZ
  `;
}

function presentArticle(article: Article): Article {
  return {
    ...article,
    title: article.title.trim(),
    summary: normalizeArticleSummary(article.summary),
    origin: article.origin === "x" ? "x" : "rss",
    xPostUrl: article.xPostUrl?.trim() || null,
    officialNote: article.officialNote?.trim() || null,
    impressions: readMetricCount(article.impressions) ?? null,
    reposts: readMetricCount(article.reposts) ?? null,
    likes: readMetricCount(article.likes) ?? null,
    metricsUpdatedAt: presentMetricsUpdatedAt(article.metricsUpdatedAt),
  };
}

function presentMetricsUpdatedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const iso = isoFrom(value, "");
  return iso || null;
}

function readLocalArticles(): Article[] {
  if (!existsSync(DATA_FILE)) return SEED_ARTICLES.map(presentArticle);
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Article[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_ARTICLES.map(presentArticle);
    }
    return parsed.map(presentArticle);
  } catch {
    return SEED_ARTICLES.map(presentArticle);
  }
}

function writeLocalArticles(articles: Article[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), "utf8");
}

function makeId(source: string, url: string) {
  const base = `${source}:${url}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return `a_${Math.abs(hash)}`;
}

function makeSignalId(xPostUrl: string) {
  const key = canonicalHttpUrl(xPostUrl) ?? xPostUrl.trim();
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 16);
  return `s_${hash}`;
}

function isoFrom(value: unknown, fallback: string) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

function mapArticleRow(row: Record<string, unknown>): Article {
  const summaryJson = row.summary_json;
  const summary =
    summaryJson && typeof summaryJson === "object"
      ? normalizeArticleSummary(summaryJson)
      : normalizeArticleSummary({
          conclusion: String(row.conclusion ?? ""),
          situations: Array.isArray(row.situations)
            ? row.situations.map(String)
            : JSON.parse(String(row.situations ?? "[]")),
        });

  return presentArticle({
    id: String(row.id),
    source: String(row.source),
    title: String(row.title),
    url: String(row.url),
    publishedAt: isoFrom(row.published_at ?? row.created_at, new Date().toISOString()),
    summary,
    createdAt: isoFrom(row.created_at, new Date().toISOString()),
    origin: row.origin === "x" ? "x" : "rss",
    xPostUrl: row.x_post_url ? String(row.x_post_url) : null,
    officialNote: row.official_note ? String(row.official_note) : null,
    impressions: readMetricCount(row.impressions) ?? null,
    reposts: readMetricCount(row.reposts) ?? null,
    likes: readMetricCount(row.likes) ?? null,
    metricsUpdatedAt: row.metrics_updated_at
      ? isoFrom(row.metrics_updated_at, "")
      : null,
  });
}

function isIntakeStatus(value: unknown): value is IntakeStatus {
  return (
    typeof value === "string" &&
    (INTAKE_STATUSES as readonly string[]).includes(value)
  );
}

function presentSignal(signal: IntakeSignal): IntakeSignal | null {
  if (!isIntakeStatus(signal.status)) return null;
  if (!signal.id || !signal.xPostUrl || !signal.body) return null;
  return {
    ...signal,
    source: signal.source.trim() || "X",
    title: signal.title.trim(),
    body: signal.body.trim(),
    author: signal.author?.trim() || null,
    officialUrl: signal.officialUrl?.trim() || null,
    filterReason: signal.filterReason?.trim() || null,
    factcheckNote: signal.factcheckNote?.trim() || null,
    articleId: signal.articleId?.trim() || null,
    updatedBy: signal.updatedBy?.trim() || null,
    impressions: readMetricCount(signal.impressions) ?? null,
    reposts: readMetricCount(signal.reposts) ?? null,
    likes: readMetricCount(signal.likes) ?? null,
    metricsUpdatedAt: presentMetricsUpdatedAt(signal.metricsUpdatedAt),
  };
}

function mapSignalRow(row: Record<string, unknown>): IntakeSignal | null {
  const createdAt = isoFrom(row.created_at, new Date().toISOString());
  return presentSignal({
    id: String(row.id),
    xPostUrl: String(row.x_post_url),
    source: String(row.source),
    title: String(row.title),
    body: String(row.body),
    author: row.author ? String(row.author) : null,
    publishedAt: isoFrom(row.published_at ?? row.created_at, createdAt),
    status: row.status as IntakeStatus,
    filterReason: row.filter_reason ? String(row.filter_reason) : null,
    officialUrl: row.official_url ? String(row.official_url) : null,
    factcheckNote: row.factcheck_note ? String(row.factcheck_note) : null,
    articleId: row.article_id ? String(row.article_id) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    createdAt,
    updatedAt: isoFrom(row.updated_at ?? row.created_at, createdAt),
    impressions: readMetricCount(row.impressions) ?? null,
    reposts: readMetricCount(row.reposts) ?? null,
    likes: readMetricCount(row.likes) ?? null,
    metricsUpdatedAt: row.metrics_updated_at
      ? isoFrom(row.metrics_updated_at, "")
      : null,
  });
}

function readLocalSignals(): IntakeSignal[] {
  if (!existsSync(SIGNALS_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(SIGNALS_FILE, "utf8")) as IntakeSignal[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => presentSignal(item))
      .filter((item): item is IntakeSignal => Boolean(item));
  } catch {
    return [];
  }
}

function writeLocalSignals(signals: IntakeSignal[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2), "utf8");
}

export async function listArticles(): Promise<Article[]> {
  if (!hasDatabaseUrl()) {
    return readLocalArticles().sort(
      (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );
  }

  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`
    SELECT id, source, title, url, published_at, conclusion, situations,
           summary_json, created_at, origin, x_post_url, official_note,
           impressions, reposts, likes, metrics_updated_at
    FROM articles
    ORDER BY COALESCE(published_at, created_at) DESC
  `;

  if (rows.length === 0) return SEED_ARTICLES.map(presentArticle);

  return rows.map((row) => mapArticleRow(row as Record<string, unknown>));
}

export async function getArticle(id: string): Promise<Article | null> {
  const articles = await listArticles();
  return articles.find((a) => a.id === id) ?? null;
}

function mergeArticle(existing: Article | undefined, incoming: Article): Article {
  if (!existing) return incoming;
  const keepX = existing.origin === "x" || incoming.origin === "x";
  return presentArticle({
    ...incoming,
    origin: keepX ? "x" : "rss",
    xPostUrl: incoming.xPostUrl || existing.xPostUrl || null,
    officialNote: incoming.officialNote || existing.officialNote || null,
    impressions: incoming.impressions ?? existing.impressions ?? null,
    reposts: incoming.reposts ?? existing.reposts ?? null,
    likes: incoming.likes ?? existing.likes ?? null,
    metricsUpdatedAt: incoming.metricsUpdatedAt ?? existing.metricsUpdatedAt ?? null,
    createdAt: existing.createdAt,
  });
}

function parseTime(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

export async function upsertArticle(payload: IngestPayload): Promise<Article> {
  const summary = normalizeArticleSummary(payload.summary);
  const now = new Date().toISOString();
  const origin = payload.origin === "x" ? "x" : "rss";
  const article = presentArticle({
    id: makeId(payload.source, payload.url),
    source: payload.source.trim(),
    title: payload.title.trim(),
    url: payload.url.trim(),
    publishedAt: parseTime(payload.publishedAt, now),
    summary,
    createdAt: now,
    origin,
    xPostUrl: origin === "x" ? payload.xPostUrl?.trim() || null : null,
    officialNote: origin === "x" ? payload.officialNote?.trim() || null : null,
    impressions: origin === "x" ? (payload.impressions ?? null) : null,
    reposts: origin === "x" ? (payload.reposts ?? null) : null,
    likes: origin === "x" ? (payload.likes ?? null) : null,
    metricsUpdatedAt:
      origin === "x" &&
      (payload.impressions != null ||
        payload.reposts != null ||
        payload.likes != null)
        ? now
        : null,
  });

  if (!hasDatabaseUrl()) {
    const current = readLocalArticles();
    const existing = current.find((item) => item.url === article.url);
    const merged = mergeArticle(existing, article);
    const next = [
      merged,
      ...current.filter((item) => item.url !== article.url),
    ];
    writeLocalArticles(next);
    return merged;
  }

  await ensureSchema();
  const sql = sqlClient();
  // conclusion / situations は一覧互換のため general を冗長保存
  // RSS の再取り込みで、すでに付いている X のリンクを消さない
  await sql`
    INSERT INTO articles (
      id, source, title, url, published_at,
      conclusion, situations, summary_json, created_at,
      origin, x_post_url, official_note,
      impressions, reposts, likes, metrics_updated_at
    )
    VALUES (
      ${article.id},
      ${article.source},
      ${article.title},
      ${article.url},
      ${article.publishedAt},
      ${article.summary.general.conclusion},
      ${JSON.stringify(article.summary.general.situations)}::jsonb,
      ${JSON.stringify(article.summary)}::jsonb,
      ${article.createdAt},
      ${article.origin ?? "rss"},
      ${article.xPostUrl},
      ${article.officialNote},
      ${article.impressions ?? null},
      ${article.reposts ?? null},
      ${article.likes ?? null},
      ${article.metricsUpdatedAt ?? null}
    )
    ON CONFLICT (url) DO UPDATE SET
      source = EXCLUDED.source,
      title = EXCLUDED.title,
      published_at = EXCLUDED.published_at,
      conclusion = EXCLUDED.conclusion,
      situations = EXCLUDED.situations,
      summary_json = EXCLUDED.summary_json,
      origin = CASE
        WHEN EXCLUDED.origin = 'x' OR articles.origin = 'x' THEN 'x'
        ELSE 'rss'
      END,
      x_post_url = COALESCE(EXCLUDED.x_post_url, articles.x_post_url),
      official_note = COALESCE(EXCLUDED.official_note, articles.official_note),
      impressions = COALESCE(EXCLUDED.impressions, articles.impressions),
      reposts = COALESCE(EXCLUDED.reposts, articles.reposts),
      likes = COALESCE(EXCLUDED.likes, articles.likes),
      metrics_updated_at = COALESCE(EXCLUDED.metrics_updated_at, articles.metrics_updated_at)
  `;

  const stored = await sql`
    SELECT id, source, title, url, published_at, conclusion, situations,
           summary_json, created_at, origin, x_post_url, official_note,
           impressions, reposts, likes, metrics_updated_at
    FROM articles
    WHERE url = ${article.url}
    LIMIT 1
  `;
  if (!stored[0]) return article;
  return mapArticleRow(stored[0] as Record<string, unknown>);
}

export type IncomingSignalDraft = {
  xPostUrl: string;
  source: string;
  title: string;
  body: string;
  author: string | null;
  publishedAt: string;
  metrics: XMetricPatch;
};

export type SavedSignal = {
  signal: IntakeSignal;
  duplicate: boolean;
};

function buildSignal(
  draft: IncomingSignalDraft,
  existing: IntakeSignal | undefined,
  now: string,
): IntakeSignal {
  const reason = coarseFilterText(draft.body);
  return {
    id: existing?.id ?? makeSignalId(draft.xPostUrl),
    xPostUrl: draft.xPostUrl.trim(),
    source: draft.source.trim() || "X",
    title: draft.title.trim(),
    body: draft.body.trim(),
    author: draft.author,
    publishedAt: draft.publishedAt,
    status: reason ? "filtered" : "pending_review",
    filterReason: reason,
    officialUrl: null,
    factcheckNote: null,
    articleId: null,
    updatedBy: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...mergeXMetrics(countsOf(existing), draft.metrics, now).metrics,
  };
}

function countsOf(signal: IntakeSignal | undefined): XMetricCounts {
  if (!signal) return emptyXMetrics();
  return {
    impressions: signal.impressions,
    reposts: signal.reposts,
    likes: signal.likes,
    metricsUpdatedAt: signal.metricsUpdatedAt,
  };
}

export async function saveIncomingSignal(
  draft: IncomingSignalDraft,
): Promise<SavedSignal> {
  const now = new Date().toISOString();
  const xPostUrl = canonicalHttpUrl(draft.xPostUrl);
  if (!xPostUrl) throw httpError("Invalid X post URL", 400);
  const normalized: IncomingSignalDraft = { ...draft, xPostUrl };

  if (!hasDatabaseUrl()) {
    const current = readLocalSignals();
    const existing = current.find(
      (item) => (canonicalHttpUrl(item.xPostUrl) ?? item.xPostUrl) === xPostUrl,
    );
    if (existing && !canResubmitSignal(existing.status)) {
      return { signal: existing, duplicate: true };
    }
    const signal = buildSignal(normalized, existing, now);
    const next = [
      signal,
      ...current.filter((item) => item.id !== signal.id),
    ];
    writeLocalSignals(next);
    return { signal, duplicate: false };
  }

  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`
    SELECT id, x_post_url, source, title, body, author, published_at, status,
           filter_reason, official_url, factcheck_note, article_id, updated_by,
           created_at, updated_at, impressions, reposts, likes, metrics_updated_at
    FROM intake_signals
    WHERE x_post_url = ${xPostUrl}
    LIMIT 1
  `;
  const existing = rows[0]
    ? mapSignalRow(rows[0] as Record<string, unknown>)
    : null;
  if (existing && !canResubmitSignal(existing.status)) {
    return { signal: existing, duplicate: true };
  }

  const signal = buildSignal(normalized, existing ?? undefined, now);
  await sql`
    INSERT INTO intake_signals (
      id, x_post_url, source, title, body, author, published_at, status,
      filter_reason, official_url, factcheck_note, article_id, updated_by,
      created_at, updated_at, impressions, reposts, likes, metrics_updated_at
    )
    VALUES (
      ${signal.id},
      ${signal.xPostUrl},
      ${signal.source},
      ${signal.title},
      ${signal.body},
      ${signal.author},
      ${signal.publishedAt},
      ${signal.status},
      ${signal.filterReason},
      ${signal.officialUrl},
      ${signal.factcheckNote},
      ${signal.articleId},
      ${signal.updatedBy},
      ${signal.createdAt},
      ${signal.updatedAt},
      ${signal.impressions},
      ${signal.reposts},
      ${signal.likes},
      ${signal.metricsUpdatedAt}
    )
    ON CONFLICT (x_post_url) DO UPDATE SET
      source = EXCLUDED.source,
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      author = EXCLUDED.author,
      published_at = EXCLUDED.published_at,
      status = EXCLUDED.status,
      filter_reason = EXCLUDED.filter_reason,
      official_url = EXCLUDED.official_url,
      factcheck_note = EXCLUDED.factcheck_note,
      article_id = EXCLUDED.article_id,
      updated_by = EXCLUDED.updated_by,
      updated_at = EXCLUDED.updated_at,
      impressions = COALESCE(EXCLUDED.impressions, intake_signals.impressions),
      reposts = COALESCE(EXCLUDED.reposts, intake_signals.reposts),
      likes = COALESCE(EXCLUDED.likes, intake_signals.likes),
      metrics_updated_at = COALESCE(EXCLUDED.metrics_updated_at, intake_signals.metrics_updated_at)
    WHERE intake_signals.status IN ('filtered', 'rejected')
  `;
  const storedRows = await sql`
    SELECT id, x_post_url, source, title, body, author, published_at, status,
           filter_reason, official_url, factcheck_note, article_id, updated_by,
           created_at, updated_at, impressions, reposts, likes, metrics_updated_at
    FROM intake_signals
    WHERE x_post_url = ${xPostUrl}
    LIMIT 1
  `;
  const stored = storedRows[0]
    ? mapSignalRow(storedRows[0] as Record<string, unknown>)
    : null;
  if (!stored) return { signal, duplicate: false };
  const wrote =
    stored.status === signal.status && stored.body === signal.body;
  if (!wrote && !canResubmitSignal(stored.status)) {
    return { signal: stored, duplicate: true };
  }
  return { signal: stored, duplicate: false };
}

export type SignalListFilter = IntakeStatus | "all" | "queue";

function matchesFilter(signal: IntakeSignal, filter: SignalListFilter) {
  if (filter === "all") return true;
  if (filter === "queue") {
    return (INTAKE_QUEUE_STATUSES as readonly string[]).includes(signal.status);
  }
  return signal.status === filter;
}

export async function listSignals(
  filter: SignalListFilter = "queue",
): Promise<IntakeSignal[]> {
  if (!hasDatabaseUrl()) {
    return readLocalSignals()
      .filter((signal) => matchesFilter(signal, filter))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  await ensureSchema();
  const sql = sqlClient();
  const rows =
    filter === "all"
      ? await sql`
          SELECT id, x_post_url, source, title, body, author, published_at, status,
                 filter_reason, official_url, factcheck_note, article_id, updated_by,
                 created_at, updated_at, impressions, reposts, likes, metrics_updated_at
          FROM intake_signals
          ORDER BY created_at DESC
        `
      : filter === "queue"
        ? await sql`
            SELECT id, x_post_url, source, title, body, author, published_at, status,
                   filter_reason, official_url, factcheck_note, article_id, updated_by,
                   created_at, updated_at, impressions, reposts, likes, metrics_updated_at
            FROM intake_signals
            WHERE status IN ('pending_review', 'needs_factcheck', 'ready')
            ORDER BY created_at DESC
          `
        : await sql`
            SELECT id, x_post_url, source, title, body, author, published_at, status,
                   filter_reason, official_url, factcheck_note, article_id, updated_by,
                   created_at, updated_at, impressions, reposts, likes, metrics_updated_at
            FROM intake_signals
            WHERE status = ${filter}
            ORDER BY created_at DESC
          `;

  return rows
    .map((row) => mapSignalRow(row as Record<string, unknown>))
    .filter((item): item is IntakeSignal => Boolean(item));
}

export async function listMemos(): Promise<IntakeSignal[]> {
  return listSignals("memo");
}

export async function getSignal(id: string): Promise<IntakeSignal | null> {
  if (!hasDatabaseUrl()) {
    return readLocalSignals().find((signal) => signal.id === id) ?? null;
  }
  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`
    SELECT id, x_post_url, source, title, body, author, published_at, status,
           filter_reason, official_url, factcheck_note, article_id, updated_by,
           created_at, updated_at, impressions, reposts, likes, metrics_updated_at
    FROM intake_signals
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapSignalRow(rows[0] as Record<string, unknown>);
}

async function writeSignal(signal: IntakeSignal): Promise<IntakeSignal> {
  if (!hasDatabaseUrl()) {
    const current = readLocalSignals();
    const next = [
      signal,
      ...current.filter((item) => item.id !== signal.id),
    ];
    writeLocalSignals(next);
    return signal;
  }

  await ensureSchema();
  const sql = sqlClient();
  await sql`
    UPDATE intake_signals SET
      status = ${signal.status},
      filter_reason = ${signal.filterReason},
      official_url = ${signal.officialUrl},
      factcheck_note = ${signal.factcheckNote},
      article_id = ${signal.articleId},
      updated_by = ${signal.updatedBy},
      updated_at = ${signal.updatedAt}
    WHERE id = ${signal.id}
  `;
  return signal;
}

export async function decideSignal(input: {
  id: string;
  action: IntakeAction;
  officialUrl: string | null;
  note: string | null;
  actor: string | null;
}): Promise<IntakeSignal> {
  const current = await getSignal(input.id);
  if (!current) throw httpError("Signal not found", 404);

  const applied = applyIntakeAction({
    status: current.status,
    action: input.action,
    officialUrl: input.officialUrl,
    xPostUrl: current.xPostUrl,
  });
  if (!applied.ok) throw httpError(applied.error, 400);

  const now = new Date().toISOString();
  const saved = await writeSignal({
    ...current,
    status: applied.decision.status,
    officialUrl: applied.decision.officialUrl,
    filterReason:
      applied.decision.status === "pending_review" ? null : current.filterReason,
    factcheckNote: input.note ?? current.factcheckNote,
    updatedBy: input.actor,
    updatedAt: now,
  });
  return saved;
}

export async function markSignalIngested(
  signalId: string,
  articleId: string,
  articleUrl: string,
): Promise<IntakeSignal> {
  const current = await getSignal(signalId);
  if (!current) throw httpError("Signal not found", 404);

  if (!articleUrlMatchesApprovedSignal(current, articleUrl)) {
    throw httpError(
      current.officialUrl
        ? "Official URL does not match the approved signal"
        : "Article URL must be the approved X post",
      409,
    );
  }

  if (current.status === "ingested") {
    if (current.articleId && current.articleId !== articleId) {
      throw httpError("Signal is already linked to another article", 409);
    }
    return current;
  }
  if (current.status !== "ready") {
    throw httpError("Signal is not ready for ingest", 409);
  }

  const saved = await writeSignal({
    ...current,
    status: "ingested",
    articleId,
    updatedAt: new Date().toISOString(),
  });
  await writeMatchingArticleMetrics(saved, countsOf(saved));
  return saved;
}

/**
 * 再送された候補の数値だけを、候補と既存のX記事へ書く。
 * タイトル・本文・要約は変えない。
 */
export async function refreshStoredXMetrics(
  signal: IntakeSignal,
  patch: XMetricPatch,
): Promise<IntakeSignal> {
  const now = new Date().toISOString();
  const { metrics } = mergeXMetrics(countsOf(signal), patch, now);
  const next: IntakeSignal = { ...signal, ...metrics };
  await writeSignalMetrics(next);
  await writeMatchingArticleMetrics(next, metrics);
  return next;
}

async function writeSignalMetrics(signal: IntakeSignal): Promise<void> {
  if (!hasDatabaseUrl()) {
    const current = readLocalSignals();
    writeLocalSignals(
      current.map((item) =>
        item.id === signal.id
          ? {
              ...item,
              impressions: signal.impressions,
              reposts: signal.reposts,
              likes: signal.likes,
              metricsUpdatedAt: signal.metricsUpdatedAt,
            }
          : item,
      ),
    );
    return;
  }

  await ensureSchema();
  const sql = sqlClient();
  await sql`
    UPDATE intake_signals SET
      impressions = ${signal.impressions},
      reposts = ${signal.reposts},
      likes = ${signal.likes},
      metrics_updated_at = ${signal.metricsUpdatedAt}
    WHERE id = ${signal.id}
  `;
}

async function writeMatchingArticleMetrics(
  signal: IntakeSignal,
  metrics: XMetricCounts,
): Promise<void> {
  const patch = patchFromCounts(metrics);
  if (!hasXMetricPatch(patch)) return;
  const nowIso = metrics.metricsUpdatedAt ?? new Date().toISOString();

  if (!hasDatabaseUrl()) {
    const current = readLocalArticles();
    const existing = findXArticle(current, signal);
    if (!existing) return;
    const refreshed = applyXMetricRefresh(existing, patch, nowIso);
    if (!refreshed.changed) return;
    writeLocalArticles(
      current.map((item) =>
        item.id === refreshed.article.id ? refreshed.article : item,
      ),
    );
    return;
  }

  await ensureSchema();
  const sql = sqlClient();
  const article = await findXArticleRow(signal);
  if (!article) return;
  const refreshed = applyXMetricRefresh(article, patch, nowIso);
  if (!refreshed.changed) return;
  await sql`
    UPDATE articles SET
      impressions = ${refreshed.article.impressions ?? null},
      reposts = ${refreshed.article.reposts ?? null},
      likes = ${refreshed.article.likes ?? null},
      metrics_updated_at = ${refreshed.article.metricsUpdatedAt ?? null}
    WHERE id = ${refreshed.article.id}
  `;
}

function findXArticle(
  articles: Article[],
  signal: Pick<IntakeSignal, "articleId" | "xPostUrl">,
): Article | undefined {
  if (signal.articleId) {
    const byId = articles.find(
      (item) => item.origin === "x" && item.id === signal.articleId,
    );
    if (byId) return byId;
  }
  const post = canonicalHttpUrl(signal.xPostUrl);
  if (!post) return undefined;
  return articles.find((item) => {
    if (item.origin !== "x" || !item.xPostUrl) return false;
    return canonicalHttpUrl(item.xPostUrl) === post;
  });
}

async function findXArticleRow(
  signal: Pick<IntakeSignal, "articleId" | "xPostUrl">,
): Promise<Article | null> {
  const sql = sqlClient();
  if (signal.articleId) {
    const byId = await sql`
      SELECT id, source, title, url, published_at, conclusion, situations,
             summary_json, created_at, origin, x_post_url, official_note,
             impressions, reposts, likes, metrics_updated_at
      FROM articles
      WHERE id = ${signal.articleId} AND origin = 'x'
      LIMIT 1
    `;
    if (byId[0]) return mapArticleRow(byId[0] as Record<string, unknown>);
  }
  const post = canonicalHttpUrl(signal.xPostUrl);
  if (!post) return null;
  const byPost = await sql`
    SELECT id, source, title, url, published_at, conclusion, situations,
           summary_json, created_at, origin, x_post_url, official_note,
           impressions, reposts, likes, metrics_updated_at
    FROM articles
    WHERE origin = 'x' AND x_post_url = ${post}
    LIMIT 1
  `;
  if (!byPost[0]) return null;
  return mapArticleRow(byPost[0] as Record<string, unknown>);
}
