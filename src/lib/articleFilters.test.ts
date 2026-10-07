import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  articleMatchesCategory,
  articleMatchesGenre,
  articlesInBrowseScope,
  availableCategories,
  buildListHref,
  discoveryHeading,
  filterArticles,
  filterByChannel,
  isSearchQuery,
  parseArticleListQuery,
  resultsHeading,
  showXChannelSort,
} from "./articleFilters";
import { ARTICLE_CATEGORIES, ARTICLE_GENRES, type CategorySlug } from "./constants";
import type { Article } from "./types";

const KEPT_GENRE_SLUGS = [
  "openai",
  "claude",
  "gemini",
  "cursor",
  "aws",
  "laravel",
  "vercel",
  "nextjs",
  "github",
  "cloudflare",
  "supabase",
] as const;

function article(
  source: string,
  title: string,
  origin?: Article["origin"],
): Article {
  return {
    id: `${source}-${title}`,
    source,
    title,
    url: "https://example.com/post",
    publishedAt: "2026-10-01T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    origin,
    summary: {
      general: { conclusion: "a", detail: "", situations: ["1", "2", "3"], terms: [] },
      engineer: { conclusion: "a", detail: "", situations: ["1", "2", "3"], terms: [] },
    },
  };
}

function categoriesOf(item: Article): CategorySlug[] {
  return ARTICLE_CATEGORIES.filter((category) =>
    articleMatchesCategory(item, category.slug),
  ).map((category) => category.slug);
}

describe("article categories", () => {
  it("splits the old AI / devtools pair into browseable groups", () => {
    assert.deepEqual(
      ARTICLE_CATEGORIES.map((category) => category.slug),
      [
        "ai-models",
        "coding-agents",
        "cloud-infra",
        "web-frameworks",
        "devtools",
        "security",
      ],
    );
    for (const slug of KEPT_GENRE_SLUGS) {
      assert.equal(
        ARTICLE_GENRES.some((genre) => genre.slug === slug),
        true,
        slug,
      );
    }
  });

  it("maps vendors onto the new categories", () => {
    const categoryBySlug = Object.fromEntries(
      ARTICLE_GENRES.map((genre) => [genre.slug, genre.category]),
    );
    assert.equal(categoryBySlug.openai, "ai-models");
    assert.equal(categoryBySlug.claude, "ai-models");
    assert.equal(categoryBySlug.gemini, "ai-models");
    assert.equal(categoryBySlug.aws, "ai-models");
    assert.equal(categoryBySlug.cursor, "coding-agents");
    assert.equal(categoryBySlug["claude-code"], "coding-agents");
    assert.equal(categoryBySlug.copilot, "coding-agents");
    assert.equal(categoryBySlug.vercel, "cloud-infra");
    assert.equal(categoryBySlug.cloudflare, "cloud-infra");
    assert.equal(categoryBySlug.supabase, "cloud-infra");
    assert.equal(categoryBySlug.laravel, "web-frameworks");
    assert.equal(categoryBySlug.nextjs, "web-frameworks");
    assert.equal(categoryBySlug.github, "devtools");
    assert.equal(categoryBySlug.security, "security");
  });

  it("keeps Claude Code out of the model bucket", () => {
    const code = article("Claude Code", "Changelog");
    assert.deepEqual(categoriesOf(code), ["coding-agents"]);
    assert.equal(articleMatchesGenre(code, "claude-code"), true);
    assert.equal(articleMatchesGenre(code, "claude"), false);

    const model = article("Claude", "New model");
    assert.deepEqual(categoriesOf(model), ["ai-models"]);
    assert.equal(articleMatchesGenre(model, "claude"), true);
  });

  it("matches source and title keywords for the other groups", () => {
    assert.deepEqual(categoriesOf(article("OpenAI", "API update")), ["ai-models"]);
    assert.deepEqual(categoriesOf(article("Google DeepMind", "Research")), ["ai-models"]);
    assert.deepEqual(
      categoriesOf(article("AWS", "Amazon Bedrock tool use")),
      ["ai-models"],
    );
    assert.deepEqual(categoriesOf(article("Cursor Changelog", "Agent")), [
      "coding-agents",
    ]);
    assert.deepEqual(
      categoriesOf(article("GitHub", "GitHub Copilot agent mode")),
      ["coding-agents"],
    );
    assert.deepEqual(categoriesOf(article("Vercel", "Fluid compute")), ["cloud-infra"]);
    assert.deepEqual(categoriesOf(article("Supabase", "Postgres")), ["cloud-infra"]);
    assert.deepEqual(categoriesOf(article("Laravel", "Release")), ["web-frameworks"]);
    assert.deepEqual(categoriesOf(article("Next.js", "Cache")), ["web-frameworks"]);
    assert.deepEqual(categoriesOf(article("GitHub Changelog", "Actions")), ["devtools"]);
  });

  it("lets a security title sit in security without dropping the vendor", () => {
    const item = article("Cloudflare", "Security update for a CVE");
    assert.deepEqual(categoriesOf(item).sort(), ["cloud-infra", "security"]);
    assert.equal(articleMatchesGenre(item, "security"), true);
    assert.equal(
      articleMatchesCategory(article("GitHub Changelog", "重大な脆弱性を修正"), "security"),
      true,
    );
  });

  it("ignores the removed ai category and a genre from another group", () => {
    assert.equal(parseArticleListQuery({ category: "ai" }).category, "");
    assert.equal(parseArticleListQuery({ category: "ai-models" }).category, "ai-models");
    assert.equal(parseArticleListQuery({ genre: "openai" }).genre, "openai");
    const mixed = parseArticleListQuery({
      category: "web-frameworks",
      genre: "openai",
    });
    assert.equal(mixed.category, "web-frameworks");
    assert.equal(mixed.genre, "");
  });

  it("filters the home list by X or official origin", () => {
    const x = article("OpenAI", "from x", "x");
    const rss = article("OpenAI", "from rss");
    assert.equal(parseArticleListQuery({}).channel, "x");
    assert.equal(parseArticleListQuery({}).window, "24h");
    assert.equal(parseArticleListQuery({ channel: "x" }).channel, "x");
    assert.equal(parseArticleListQuery({ channel: "official" }).channel, "official");
    assert.equal(parseArticleListQuery({ channel: "sns" }).channel, "x");
    assert.equal(parseArticleListQuery({ sort: "likes" }).channel, "x");
    assert.equal(parseArticleListQuery({ sort: "likes" }).sort, "likes");
    assert.equal(discoveryHeading("x", "24h"), "直近24時間の発見");
    assert.equal(discoveryHeading("official", "24h"), "公式サイト・直近24時間の発見");
    assert.equal(discoveryHeading("all", "today"), "All・今日の発見");
    assert.equal(discoveryHeading("x", "all"), "すべての発見");

    assert.deepEqual(
      filterByChannel([x, rss], "x").map((item) => item.id),
      [x.id],
    );
    assert.deepEqual(
      filterByChannel([x, rss], "official").map((item) => item.id),
      [rss.id],
    );
    assert.equal(filterByChannel([x, rss], "all").length, 2);
    assert.equal(buildListHref({ channel: "all" }), "/?channel=all");
    assert.equal(buildListHref({ channel: "x" }), "/");
    assert.equal(
      buildListHref({ channel: "official", window: "all" }),
      "/?channel=official&window=all",
    );
    assert.equal(parseArticleListQuery({ channel: "x" }).sort, "latest");
    assert.equal(
      parseArticleListQuery({ channel: "x", sort: "impressions" }).sort,
      "impressions",
    );
    assert.equal(
      parseArticleListQuery({ channel: "official", sort: "impressions" }).sort,
      "latest",
    );
    assert.equal(
      parseArticleListQuery({ channel: "x", sort: "likes" }).sort,
      "likes",
    );
    assert.equal(
      parseArticleListQuery({ channel: "official", sort: "likes" }).sort,
      "latest",
    );
    assert.equal(
      parseArticleListQuery({ channel: "all", sort: "likes" }).sort,
      "latest",
    );
    assert.equal(
      buildListHref({ channel: "x", sort: "impressions" }),
      "/?sort=impressions",
    );
    assert.equal(
      buildListHref({ channel: "x", sort: "likes" }),
      "/?sort=likes",
    );
    assert.equal(
      buildListHref({ channel: "official", sort: "impressions" }),
      "/?channel=official",
    );
    assert.equal(
      buildListHref({ channel: "official", sort: "likes" }),
      "/?channel=official",
    );
    assert.equal(buildListHref({ channel: "x", sort: "latest" }), "/");
  });

  it("searches every article when q is set and keeps the channel window when q is empty", () => {
    const now = new Date("2026-10-07T12:00:00.000Z");
    const recentX = article("OpenAI", "today from x", "x");
    recentX.publishedAt = "2026-10-07T00:00:00.000Z";
    const oldLaravel = article("Laravel", "old framework release");
    oldLaravel.publishedAt = "2026-07-01T00:00:00.000Z";
    const items = [recentX, oldLaravel];

    const browsing = parseArticleListQuery({});
    assert.equal(isSearchQuery(browsing), false);
    assert.equal(showXChannelSort(browsing), true);
    assert.equal(resultsHeading(browsing), "直近24時間の発見");
    assert.deepEqual(
      articlesInBrowseScope(items, browsing, now).map((item) => item.id),
      [recentX.id],
    );

    const searching = parseArticleListQuery({
      q: " Laravel ",
      channel: "x",
      window: "24h",
      sort: "likes",
    });
    assert.equal(searching.q, "Laravel");
    assert.equal(isSearchQuery(searching), true);
    assert.equal(showXChannelSort(searching), false);
    assert.equal(resultsHeading(searching), "検索結果");
    assert.equal(
      resultsHeading({ q: "Laravel", channel: "official", window: "today" }),
      "検索結果",
    );
    assert.deepEqual(
      articlesInBrowseScope(items, searching, now).map((item) => item.id),
      [recentX.id, oldLaravel.id],
    );
    assert.deepEqual(
      filterArticles(articlesInBrowseScope(items, searching, now), searching).map(
        (item) => item.id,
      ),
      [oldLaravel.id],
    );
    assert.deepEqual(
      filterArticles(articlesInBrowseScope(items, searching, now), {
        ...searching,
        category: "ai-models",
      }).map((item) => item.id),
      [],
    );
    assert.equal(parseArticleListQuery({ q: "   " }).q, "");
    assert.equal(isSearchQuery(parseArticleListQuery({ q: "   " })), false);
    assert.equal(
      showXChannelSort(parseArticleListQuery({ channel: "official" })),
      false,
    );
  });

  it("lists only categories that have a matching article", () => {
    const slugs = availableCategories([
      article("OpenAI", "News"),
      article("Laravel", "Vite"),
    ]).map((category) => category.slug);
    assert.deepEqual(slugs, ["ai-models", "web-frameworks"]);
  });
});
