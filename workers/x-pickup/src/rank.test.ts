import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferSource,
  normalizeStatusUrl,
  parseEngagementCount,
  parseMetricCounts,
  pickOfficialUrl,
  postOrder,
  resolveOfficialUrl,
  selectBuzzCandidates,
  type RawTweetCard,
} from "./rank.ts";

const NOW = new Date("2026-10-05T00:00:00.000Z");
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

function card(overrides: Partial<RawTweetCard> = {}): RawTweetCard {
  return {
    statusUrl: "https://x.com/openai/status/111",
    text: "OpenAI published a new model for the API today.",
    authorHandle: "openai",
    publishedAt: "2026-10-04T12:00:00.000Z",
    links: ["https://openai.com/index/new-model"],
    metricText: "10 replies, 20 reposts, 100 likes, 5000 views",
    isReply: false,
    isAd: false,
    topIndex: 0,
    ...overrides,
  };
}

describe("engagement counts", () => {
  it("reads compact and Japanese counts", () => {
    assert.equal(parseEngagementCount("1,234"), 1234);
    assert.equal(parseEngagementCount("1.2K"), 1200);
    assert.equal(parseEngagementCount("3M"), 3_000_000);
    assert.equal(parseEngagementCount("1.2万"), 12000);
    assert.equal(parseEngagementCount("2億"), 200_000_000);
    assert.equal(parseEngagementCount("nope"), undefined);
  });

  it("reads an English group label and a Japanese label", () => {
    assert.deepEqual(
      parseMetricCounts("10 replies, 200 reposts, 3000 likes, 120000 views"),
      { impressions: 120000, reposts: 200, likes: 3000 },
    );
    assert.deepEqual(parseMetricCounts("1.2万件の表示 80件のリポスト 3,421件のいいね"), {
      impressions: 12000,
      reposts: 80,
      likes: 3421,
    });
  });
});

describe("buzz selection", () => {
  it("keeps topic posts, prefers official pages, and sorts by buzz", () => {
    const result = selectBuzzCandidates(
      [
        card({ topIndex: 1 }),
        card({
          statusUrl: "/food/status/333",
          text: "今日のランチはカレーでした。とてもおいしいです。",
          authorHandle: "food",
          links: [],
        }),
        card({
          isReply: true,
          statusUrl: "/someone/status/444",
          text: "Claude の返信です。十分に長い本文。",
        }),
        card({
          statusUrl: "https://x.com/openai/status/111/photo/1",
          metricText: "1 reply, 1 repost, 1 like, 1 view",
        }),
        card({
          publishedAt: "2026-09-01T00:00:00.000Z",
          statusUrl: "/old/status/555",
          text: "Gemini update from last month for the API and developers.",
          authorHandle: "geminiapp",
        }),
        card({
          statusUrl: "/someone/status/222",
          text: "Claude の新しいモデルが公開された、という投稿です。API も更新。",
          authorHandle: "someone",
          metricText: "1 reply, 10 reposts, 50 likes, 800 views",
          links: ["https://youtu.be/abc", "https://www.anthropic.com/news/claude"],
          topIndex: 3,
        }),
        card({ isAd: true, text: "Cursor の広告です。本文は足りている長さです。" }),
      ],
      { now: NOW, limit: 15, maxAgeMs: MAX_AGE_MS },
    );

    assert.equal(result.candidates.length, 2);
    assert.equal(result.candidates[0].xPostUrl, "https://x.com/openai/status/111");
    assert.equal(result.candidates[0].source, "OpenAI");
    assert.equal(result.candidates[0].author, "@openai");
    assert.equal(result.candidates[0].officialUrl, "https://openai.com/index/new-model");
    assert.equal(result.candidates[0].impressions, 5000);
    assert.equal(result.candidates[1].source, "Claude");
    assert.equal(result.candidates[1].officialUrl, "https://www.anthropic.com/news/claude");
    assert.equal(result.dropped.coarse, 1);
    assert.equal(result.dropped.replyOrAd, 2);
    assert.equal(result.dropped.stale, 1);
    assert.equal(result.dropped.duplicate, 1);
    assert.deepEqual(
      postOrder(result.candidates).map((item) => item.xPostUrl),
      ["https://x.com/someone/status/222", "https://x.com/openai/status/111"],
    );
  });

  it("caps the list at the requested limit", () => {
    const cards = Array.from({ length: 5 }, (_, index) =>
      card({
        statusUrl: `/openai/status/${100 + index}`,
        text: `OpenAI API update number ${index} is long enough to keep.`,
        metricText: `${index} likes, ${index} views`,
        topIndex: index,
        links: [],
      }),
    );
    const result = selectBuzzCandidates(cards, { now: NOW, limit: 2, maxAgeMs: MAX_AGE_MS });
    assert.equal(result.candidates.length, 2);
  });
});

describe("official links and sources", () => {
  it("normalizes status URLs and skips social hosts", () => {
    assert.equal(
      normalizeStatusUrl("https://twitter.com/openai/status/99?s=20"),
      "https://x.com/openai/status/99",
    );
    assert.equal(normalizeStatusUrl("https://x.com/openai"), null);
    assert.equal(
      pickOfficialUrl([
        "https://t.co/abc",
        "https://www.youtube.com/watch?v=1",
        "https://example.com/notes/1",
        "https://openai.com/news/",
      ]),
      "https://openai.com/news",
    );
    assert.equal(pickOfficialUrl(["https://t.co/abc", "https://x.com/openai/status/1"]), null);
  });

  it("follows a t.co redirect to the official page", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(null, {
        status: 301,
        headers: { location: "https://cursor.com/changelog/1" },
      });
    assert.equal(
      await resolveOfficialUrl(["https://t.co/abc"], fetchImpl),
      "https://cursor.com/changelog/1",
    );
  });

  it("labels known handles before the post text", () => {
    assert.equal(inferSource("cursor_ai", "we shipped Claude too"), "Cursor");
    assert.equal(inferSource("stranger", "Claude Code can edit the repo"), "Claude Code");
    assert.equal(inferSource(null, "no product here at all"), "X");
  });
});
