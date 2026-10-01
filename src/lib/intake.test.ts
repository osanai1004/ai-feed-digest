import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArticleListQuery } from "./articleFilters";
import { applyIntakeAction, coarseFilterText, isOfficialPrimaryUrl, isXPostUrl } from "./intake";
import { isInListWindow } from "./listWindow";
import { bundleSourceBursts } from "./sourceBurst";
import type { Article } from "./types";

function article(source: string, publishedAt: string, id: string): Article {
  return {
    id,
    source,
    title: id,
    url: `https://example.com/${id}`,
    publishedAt,
    createdAt: publishedAt,
    summary: {
      general: { conclusion: "a", detail: "", situations: ["1", "2", "3"], terms: [] },
      engineer: { conclusion: "a", detail: "", situations: ["1", "2", "3"], terms: [] },
    },
  };
}

describe("X post URL", () => {
  it("accepts a status URL and rejects profiles and official blogs", () => {
    assert.equal(isXPostUrl("https://x.com/openai/status/123456"), true);
    assert.equal(isXPostUrl("https://twitter.com/openai/status/123456"), true);
    assert.equal(isXPostUrl("https://x.com/openai"), false);
    assert.equal(isXPostUrl("http://x.com/openai/status/123456"), false);
    assert.equal(isOfficialPrimaryUrl("https://openai.com/news/gpt"), true);
    assert.equal(isOfficialPrimaryUrl("https://x.com/openai/status/123456"), false);
  });
});

describe("coarse filter", () => {
  it("drops short posts and posts outside the watched topics", () => {
    assert.equal(coarseFilterText("hi"), "too_short");
    assert.equal(coarseFilterText("今日のランチはカレーでした。とてもおいしい。"), "topic_miss");
    assert.equal(coarseFilterText("Claude の新しいモデルが公開された、という投稿です"), null);
  });
});

describe("human gate", () => {
  it("turns an official URL into ready and the lack of one into a memo", () => {
    const approved = applyIntakeAction({
      status: "pending_review",
      action: "approve",
      officialUrl: "https://openai.com/news",
    });
    assert.equal(approved.ok, true);
    if (approved.ok) assert.equal(approved.decision.status, "ready");

    const memo = applyIntakeAction({
      status: "pending_review",
      action: "approve",
      officialUrl: null,
    });
    assert.equal(memo.ok, true);
    if (memo.ok) assert.equal(memo.decision.status, "memo");
  });

  it("lets 龍馬 resolve an ambiguous fact-check", () => {
    const flagged = applyIntakeAction({
      status: "pending_review",
      action: "flag_factcheck",
      officialUrl: null,
    });
    assert.equal(flagged.ok, true);
    if (!flagged.ok) return;
    assert.equal(flagged.decision.status, "needs_factcheck");

    const resolved = applyIntakeAction({
      status: "needs_factcheck",
      action: "resolve_factcheck",
      officialUrl: "https://www.anthropic.com/news/claude",
    });
    assert.equal(resolved.ok, true);
    if (resolved.ok) assert.equal(resolved.decision.status, "ready");
  });

  it("does not summarize a filtered item until it is restored", () => {
    const direct = applyIntakeAction({
      status: "filtered",
      action: "approve",
      officialUrl: "https://openai.com/news",
    });
    assert.equal(direct.ok, false);
    const restored = applyIntakeAction({
      status: "filtered",
      action: "restore",
      officialUrl: null,
    });
    assert.equal(restored.ok, true);
    if (restored.ok) assert.equal(restored.decision.status, "pending_review");
  });
});

describe("list window", () => {
  const now = new Date("2026-10-01T01:00:00.000Z");

  it("defaults to 24h and keeps today in Asia/Tokyo", () => {
    assert.equal(parseArticleListQuery({}).window, "24h");
    assert.equal(isInListWindow("2026-09-30T02:00:00.000Z", "24h", now), true);
    assert.equal(isInListWindow("2026-09-29T00:00:00.000Z", "24h", now), false);
    assert.equal(isInListWindow("2026-09-30T15:00:00.000Z", "today", now), true);
    assert.equal(isInListWindow("2026-09-30T14:00:00.000Z", "today", now), false);
  });
});

describe("source bursts", () => {
  it("bundles only a close run from the same source", () => {
    const entries = bundleSourceBursts([
      article("OpenAI", "2026-10-01T12:00:00.000Z", "a"),
      article("OpenAI", "2026-10-01T11:00:00.000Z", "b"),
      article("OpenAI", "2026-10-01T10:00:00.000Z", "c"),
      article("Claude", "2026-10-01T09:30:00.000Z", "d"),
      article("OpenAI", "2026-10-01T01:00:00.000Z", "e"),
    ]);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].kind, "burst");
    if (entries[0].kind === "burst") assert.equal(entries[0].articles.length, 3);
    assert.equal(entries[1].kind, "article");
    assert.equal(entries[2].kind, "article");
  });
});
