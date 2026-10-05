import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArticleListQuery } from "./articleFilters";
import {
  applyIntakeAction,
  articleUrlMatchesApprovedSignal,
  coarseFilterText,
  isOfficialPrimaryUrl,
  isXPostUrl,
  officialUrlForDecision,
  readIncomingOfficialUrl,
  resolveXIngestSource,
} from "./intake";
import { summaryExplainsContent } from "./summary";
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
    assert.equal(coarseFilterText("GitHub Copilot のエージェントが更新された、という話"), null);
    assert.equal(coarseFilterText("CVE-2026-1000 の脆弱性が公開されたので確認する"), null);
  });
});

const X_POST = "https://x.com/openai/status/123456";

describe("human gate", () => {
  it("turns an approval into ready with or without an official URL", () => {
    const approved = applyIntakeAction({
      status: "pending_review",
      action: "approve",
      officialUrl: "https://openai.com/news",
      xPostUrl: X_POST,
    });
    assert.equal(approved.ok, true);
    if (approved.ok) {
      assert.equal(approved.decision.status, "ready");
      assert.equal(approved.decision.officialUrl, "https://openai.com/news");
    }

    const fromPost = applyIntakeAction({
      status: "pending_review",
      action: "approve",
      officialUrl: null,
      xPostUrl: X_POST,
    });
    assert.equal(fromPost.ok, true);
    if (fromPost.ok) {
      assert.equal(fromPost.decision.status, "ready");
      assert.equal(fromPost.decision.officialUrl, null);
    }

    const missingSource = applyIntakeAction({
      status: "pending_review",
      action: "approve",
      officialUrl: null,
    });
    assert.equal(missingSource.ok, false);
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
      xPostUrl: X_POST,
    });
    assert.equal(resolved.ok, true);
    if (resolved.ok) assert.equal(resolved.decision.status, "ready");

    const fromPost = applyIntakeAction({
      status: "needs_factcheck",
      action: "resolve_factcheck",
      officialUrl: null,
      xPostUrl: X_POST,
    });
    assert.equal(fromPost.ok, true);
    if (fromPost.ok) assert.equal(fromPost.decision.status, "ready");
  });

  it("promotes a memo to ready only when explicitly approved", () => {
    const fromPost = applyIntakeAction({
      status: "memo",
      action: "approve",
      officialUrl: null,
      xPostUrl: X_POST,
    });
    assert.equal(fromPost.ok, true);
    if (fromPost.ok) {
      assert.equal(fromPost.decision.status, "ready");
      assert.equal(fromPost.decision.officialUrl, null);
    }

    const withOfficial = applyIntakeAction({
      status: "memo",
      action: "approve",
      officialUrl: "https://openai.com/news",
      xPostUrl: X_POST,
    });
    assert.equal(withOfficial.ok, true);
    if (withOfficial.ok) {
      assert.equal(withOfficial.decision.status, "ready");
      assert.equal(withOfficial.decision.officialUrl, "https://openai.com/news");
    }

    const missingSource = applyIntakeAction({
      status: "memo",
      action: "approve",
      officialUrl: null,
    });
    assert.equal(missingSource.ok, false);

    const notAPost = applyIntakeAction({
      status: "memo",
      action: "approve",
      officialUrl: null,
      xPostUrl: "https://x.com/openai",
    });
    assert.equal(notAPost.ok, false);

    const restored = applyIntakeAction({
      status: "memo",
      action: "restore",
      officialUrl: null,
      xPostUrl: X_POST,
    });
    assert.equal(restored.ok, false);
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

describe("X ingest fallback", () => {
  it("uses the X post URL when the official page is missing or empty", () => {
    const missing = resolveXIngestSource({
      officialUrl: null,
      xPostUrl: X_POST,
      officialText: "",
    });
    assert.equal(missing.url, X_POST);
    assert.equal(missing.officialNote, null);
    assert.equal(missing.evidence, "x");

    const emptyPage = resolveXIngestSource({
      officialUrl: "https://openai.com/news",
      xPostUrl: X_POST,
      officialText: "  ",
    });
    assert.equal(emptyPage.url, "https://openai.com/news");
    assert.equal(emptyPage.officialNote, null);
    assert.equal(emptyPage.evidence, "x");

    assert.equal(
      articleUrlMatchesApprovedSignal(
        { officialUrl: null, xPostUrl: X_POST },
        X_POST,
      ),
      true,
    );
    assert.equal(
      articleUrlMatchesApprovedSignal(
        { officialUrl: null, xPostUrl: X_POST },
        "https://openai.com/news",
      ),
      false,
    );
  });

  it("keeps the official URL and note when the page text exists", () => {
    const resolved = resolveXIngestSource({
      officialUrl: "https://openai.com/news",
      xPostUrl: X_POST,
      officialText: "We shipped a longer context window.",
    });
    assert.equal(resolved.url, "https://openai.com/news");
    assert.equal(resolved.officialNote, "公式もこう言っている");
    assert.equal(resolved.evidence, "official");
    assert.equal(
      articleUrlMatchesApprovedSignal(
        { officialUrl: "https://openai.com/news/", xPostUrl: X_POST },
        "https://openai.com/news",
      ),
      true,
    );
  });

  it("rejects a summary that only repeats the title", () => {
    const title = "新しいモデル";
    assert.equal(
      summaryExplainsContent(title, {
        general: { conclusion: title, situations: ["a"] },
        engineer: { conclusion: "APIの入力上限が伸びた。", situations: ["a"] },
      }),
      false,
    );
    assert.equal(
      summaryExplainsContent(title, {
        general: { conclusion: "長い作業の途中忘れが減った、と投稿にある。", situations: ["a"] },
        engineer: { conclusion: "長文コンテキストの脱落が減ったという報告。", situations: ["a"] },
      }),
      true,
    );
  });
});

describe("official URL on intake", () => {
  it("keeps a stored official URL when approval omits the field", () => {
    assert.equal(
      officialUrlForDecision("approve", undefined, "https://openai.com/news"),
      "https://openai.com/news",
    );
    assert.equal(
      officialUrlForDecision("approve", null, "https://openai.com/news"),
      null,
    );
    assert.equal(
      officialUrlForDecision(
        "approve",
        "https://www.anthropic.com/news/claude",
        "https://openai.com/news",
      ),
      "https://www.anthropic.com/news/claude",
    );
    assert.equal(
      officialUrlForDecision("reject", undefined, "https://openai.com/news"),
      null,
    );
  });

  it("accepts an official page and rejects X URLs", () => {
    const page = readIncomingOfficialUrl("https://openai.com/news/");
    assert.equal(page.ok, true);
    if (page.ok) assert.equal(page.officialUrl, "https://openai.com/news");
    assert.equal(readIncomingOfficialUrl(null).ok, true);
    assert.equal(readIncomingOfficialUrl("https://x.com/openai/status/1").ok, false);
    assert.equal(readIncomingOfficialUrl("javascript:alert(1)").ok, false);
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
