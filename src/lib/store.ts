import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { SEED_ARTICLES } from "./seed";
import { normalizeMultilineText } from "./text";
import type { Article, IngestPayload } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");

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
}

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    title: article.title.trim(),
    summary: {
      conclusion: normalizeMultilineText(article.summary.conclusion),
      situations: article.summary.situations.map((s) =>
        normalizeMultilineText(String(s)),
      ),
    },
  };
}

function readLocalArticles(): Article[] {
  if (!existsSync(DATA_FILE)) return SEED_ARTICLES.map(normalizeArticle);
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Article[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_ARTICLES.map(normalizeArticle);
    }
    return parsed.map(normalizeArticle);
  } catch {
    return SEED_ARTICLES.map(normalizeArticle);
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

function normalizeSummary(summary: IngestPayload["summary"]) {
  const situations = (summary.situations ?? [])
    .filter(Boolean)
    .map((s) => normalizeMultilineText(String(s)).trim())
    .slice(0, 3);
  while (situations.length < 3) {
    situations.push("（シチュエーション未入力）");
  }
  return {
    conclusion:
      normalizeMultilineText(summary.conclusion ?? "").trim() ||
      "（結論未入力）",
    situations,
  };
}

function mapArticleRow(row: Record<string, unknown>): Article {
  const situationsRaw = row.situations;
  const situations = Array.isArray(situationsRaw)
    ? situationsRaw.map(String)
    : JSON.parse(String(situationsRaw));

  return {
    id: String(row.id),
    source: String(row.source),
    title: String(row.title),
    url: String(row.url),
    publishedAt: new Date(
      String(row.published_at ?? row.created_at),
    ).toISOString(),
    summary: {
      conclusion: normalizeMultilineText(String(row.conclusion)),
      situations: situations.map((s: string) =>
        normalizeMultilineText(String(s)),
      ),
    },
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
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
    SELECT id, source, title, url, published_at, conclusion, situations, created_at
    FROM articles
    ORDER BY COALESCE(published_at, created_at) DESC
  `;

  if (rows.length === 0) return SEED_ARTICLES.map(normalizeArticle);

  return rows.map((row) => mapArticleRow(row as Record<string, unknown>));
}

export async function getArticle(id: string): Promise<Article | null> {
  const articles = await listArticles();
  return articles.find((a) => a.id === id) ?? null;
}

export async function upsertArticle(payload: IngestPayload): Promise<Article> {
  const summary = normalizeSummary(payload.summary);
  const now = new Date().toISOString();
  const article: Article = {
    id: makeId(payload.source, payload.url),
    source: payload.source.trim(),
    title: payload.title.trim(),
    url: payload.url.trim(),
    publishedAt: payload.publishedAt
      ? new Date(payload.publishedAt).toISOString()
      : now,
    summary,
    createdAt: now,
  };

  if (!hasDatabaseUrl()) {
    const current = readLocalArticles().filter((a) => a.url !== article.url);
    current.unshift(article);
    writeLocalArticles(current);
    return article;
  }

  await ensureSchema();
  const sql = sqlClient();
  await sql`
    INSERT INTO articles (id, source, title, url, published_at, conclusion, situations, created_at)
    VALUES (
      ${article.id},
      ${article.source},
      ${article.title},
      ${article.url},
      ${article.publishedAt},
      ${article.summary.conclusion},
      ${JSON.stringify(article.summary.situations)}::jsonb,
      ${article.createdAt}
    )
    ON CONFLICT (url) DO UPDATE SET
      source = EXCLUDED.source,
      title = EXCLUDED.title,
      published_at = EXCLUDED.published_at,
      conclusion = EXCLUDED.conclusion,
      situations = EXCLUDED.situations
  `;

  return article;
}

export function storageMode(): "neon" | "local-json" {
  return hasDatabaseUrl() ? "neon" : "local-json";
}
