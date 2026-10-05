import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { chromium } from "playwright";
import { isBlockedXStatus, readTweetCards } from "./collect.ts";
import { selectBuzzCandidates } from "./rank.ts";

describe("tweet card extraction", () => {
  it("treats X's empty deny responses as blocked", () => {
    assert.equal(isBlockedXStatus(403), true);
    assert.equal(isBlockedXStatus(429), true);
    assert.equal(isBlockedXStatus(200), false);
  });

  it("reads the fixture page into buzz candidates", async (t) => {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      t.skip("Chromium is not installed");
      return;
    }
    try {
      const page = await browser.newPage();
      const fixture = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../fixture/tweets.html",
      );
      await page.goto(pathToFileURL(fixture).href);
      const cards = await readTweetCards(page);
      assert.equal(cards.length, 3);
      assert.equal(cards[0].statusHref, "/OpenAI/status/111");
      assert.equal(cards[0].authorHandle, "OpenAI");
      assert.match(cards[0].metricText, /120000 views/);
      assert.equal(cards[2].isReply, true);

      const selected = selectBuzzCandidates(
        cards.map((card, index) => ({
          statusUrl: card.statusHref ?? "",
          text: card.text,
          authorHandle: card.authorHandle,
          publishedAt: card.publishedAt,
          links: card.links,
          metricText: card.metricText,
          isReply: card.isReply,
          isAd: card.isAd,
          topIndex: index,
        })),
        {
          now: new Date("2026-10-05T00:00:00.000Z"),
          limit: 15,
          maxAgeMs: 48 * 60 * 60 * 1000,
        },
      );
      assert.equal(selected.candidates.length, 1);
      assert.equal(selected.candidates[0].xPostUrl, "https://x.com/OpenAI/status/111");
      assert.equal(selected.candidates[0].source, "OpenAI");
      assert.equal(selected.candidates[0].impressions, 120000);
      assert.equal(selected.candidates[0].reposts, 200);
      assert.equal(selected.candidates[0].likes, 3000);
      assert.equal(selected.candidates[0].officialUrl, "https://openai.com/index/new-model");
    } finally {
      await browser.close();
    }
  });
});
