import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyUserAgent } from "./botFilter";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

describe("classifyUserAgent", () => {
  it("普通のブラウザは通す", () => {
    assert.equal(classifyUserAgent(CHROME), "allow");
    assert.equal(classifyUserAgent(IPHONE), "allow");
  });

  it("名乗らないものは通す", () => {
    assert.equal(classifyUserAgent(""), "allow");
    assert.equal(classifyUserAgent(null), "allow");
  });

  it("URL プレビューの機械は通す", () => {
    for (const ua of [
      "Twitterbot/1.0",
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      "Slackbot 1.0 (+https://api.slack.com/robots)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
      "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
      "TelegramBot (like TwitterBot)",
      "WhatsApp/2.23.20.0",
    ]) {
      assert.equal(classifyUserAgent(ua), "allow-preview", ua);
    }
  });

  it("GAS は通す（/api/articles を読むため）", () => {
    assert.equal(
      classifyUserAgent(
        "Mozilla/5.0 (compatible; Google-Apps-Script; beanserver; +https://script.google.com; id: UAEmdDd8abcdef)",
      ),
      "allow-preview",
    );
  });

  it("AI 収集・検索エンジン・SEO・汎用の機械は断る", () => {
    for (const ua of [
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
      "CCBot/2.0 (https://commoncrawl.org/faq/)",
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
      "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
      "python-requests/2.32.3",
      "curl/8.7.1",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36",
      "SomeRandomCrawler/0.1",
    ]) {
      assert.equal(classifyUserAgent(ua), "block", ua);
    }
  });
});

describe("classifyUserAgent の取りこぼし・誤爆", () => {
  it("機種名に bot を含むスマホは断らない", () => {
    assert.equal(
      classifyUserAgent(
        "Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
      ),
      "allow",
    );
  });
});
