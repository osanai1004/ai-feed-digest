import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  X_METRICS_REFRESH_DAYS,
  X_METRICS_REFRESH_MAX,
  X_METRICS_REFRESH_WINDOW_CAP,
} from "./constants";
import type { Article } from "./types";
import {
  applyXMetricRefresh,
  decideMetricRefresh,
  readMetricsRefreshWindowDays,
  readXMetricPatch,
  sortXChannelArticles,
} from "./xMetrics";

function article(
  id: string,
  publishedAt: string,
  impressions?: number | null,
): Article {
  return {
    id,
    source: "OpenAI",
    title: id,
    url: `https://example.com/${id}`,
    publishedAt,
    createdAt: publishedAt,
    origin: "x",
    impressions: impressions ?? null,
    summary: {
      general: { conclusion: "本文", detail: "", situations: ["1"], terms: [] },
      engineer: { conclusion: "本文", detail: "", situations: ["1"], terms: [] },
    },
  };
}

describe("X metric patch", () => {
  it("keeps missing fields out of the patch and accepts zero", () => {
    assert.deepEqual(readXMetricPatch({ text: "hello" }), {});
    assert.deepEqual(readXMetricPatch({ impressions: 0, reposts: 3 }), {
      impressions: 0,
      reposts: 3,
    });
    assert.deepEqual(
      readXMetricPatch({
        public_metrics: { impression_count: 10, retweet_count: 2, like_count: 4 },
      }),
      { impressions: 10, reposts: 2, likes: 4 },
    );
    assert.deepEqual(
      readXMetricPatch({
        impressions: 8,
        public_metrics: { impression_count: 10, like_count: 1 },
      }),
      { impressions: 8, likes: 1 },
    );
    assert.deepEqual(
      readXMetricPatch({ impressions: -1, reposts: 1.5, likes: "many" }),
      {},
    );
  });

  it("updates only the provided counts and leaves title and summary", () => {
    const summary = article("a", "2026-10-01T00:00:00.000Z", 5).summary;
    const current = article("a", "2026-10-01T00:00:00.000Z", 5);
    current.summary = summary;
    current.reposts = null;
    const refreshed = applyXMetricRefresh(
      current,
      { reposts: 4 },
      "2026-10-01T03:00:00.000Z",
    );
    assert.equal(refreshed.changed, true);
    assert.equal(refreshed.article.title, "a");
    assert.equal(refreshed.article.summary, summary);
    assert.equal(refreshed.article.impressions, 5);
    assert.equal(refreshed.article.reposts, 4);
    assert.equal(refreshed.article.likes, null);
    assert.equal(refreshed.article.metricsUpdatedAt, "2026-10-01T03:00:00.000Z");

    const same = applyXMetricRefresh(
      refreshed.article,
      { reposts: 4 },
      "2026-10-02T00:00:00.000Z",
    );
    assert.equal(same.changed, false);
    assert.equal(same.article.metricsUpdatedAt, "2026-10-01T03:00:00.000Z");
  });
});

describe("X metric refresh window", () => {
  const now = new Date("2026-10-01T00:00:00.000Z");
  const recent = "2026-09-20T00:00:00.000Z";
  const edge = new Date(
    now.getTime() - X_METRICS_REFRESH_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const older = "2026-08-01T00:00:00.000Z";

  it("refreshes recent posts and skips empty, old, and over-cap items", () => {
    assert.equal(
      decideMetricRefresh({
        publishedAt: recent,
        patch: { impressions: 12 },
        now,
        refreshedSoFar: 0,
      }),
      "refresh",
    );
    assert.equal(
      decideMetricRefresh({
        publishedAt: edge,
        patch: { impressions: 1 },
        now,
        refreshedSoFar: 0,
      }),
      "refresh",
    );
    assert.equal(
      decideMetricRefresh({
        publishedAt: older,
        patch: { impressions: 99 },
        now,
        refreshedSoFar: 0,
      }),
      "skip_window",
    );
    assert.equal(
      decideMetricRefresh({
        publishedAt: recent,
        patch: {},
        now,
        refreshedSoFar: 0,
      }),
      "skip_empty",
    );
    assert.equal(
      decideMetricRefresh({
        publishedAt: recent,
        patch: { likes: 1 },
        now,
        refreshedSoFar: X_METRICS_REFRESH_MAX,
      }),
      "skip_cap",
    );
  });

  it("widens one refresh with windowDays and leaves the 14-day default", () => {
    const backfillNow = new Date("2026-10-01T12:00:00.000Z");
    const publishedAt = "2026-09-15T12:00:00.000Z";
    const patch = { impressions: 20, reposts: 1, likes: 2 };
    assert.equal(
      decideMetricRefresh({
        publishedAt,
        patch,
        now: backfillNow,
        refreshedSoFar: 0,
      }),
      "skip_window",
    );
    assert.equal(
      decideMetricRefresh({
        publishedAt,
        patch,
        now: backfillNow,
        refreshedSoFar: 0,
        windowDays: 17,
      }),
      "refresh",
    );
    const outside = new Date(
      backfillNow.getTime() - 17 * 24 * 60 * 60 * 1000 - 1,
    ).toISOString();
    assert.equal(
      decideMetricRefresh({
        publishedAt: outside,
        patch,
        now: backfillNow,
        refreshedSoFar: 0,
        windowDays: 17,
      }),
      "skip_window",
    );
    assert.equal(
      decideMetricRefresh({
        publishedAt,
        patch,
        now: backfillNow,
        refreshedSoFar: X_METRICS_REFRESH_MAX,
        windowDays: 17,
      }),
      "skip_cap",
    );
  });
});

describe("metricsRefreshWindowDays", () => {
  it("accepts an omitted value and integers from 1 through the cap", () => {
    assert.deepEqual(readMetricsRefreshWindowDays(undefined), { ok: true });
    assert.deepEqual(readMetricsRefreshWindowDays(1), { ok: true, days: 1 });
    assert.deepEqual(readMetricsRefreshWindowDays(17), { ok: true, days: 17 });
    assert.deepEqual(readMetricsRefreshWindowDays(X_METRICS_REFRESH_WINDOW_CAP), {
      ok: true,
      days: X_METRICS_REFRESH_WINDOW_CAP,
    });
    assert.equal(X_METRICS_REFRESH_DAYS, 14);
  });

  it("rejects values outside a safe positive integer at or below the cap", () => {
    const rejected = [
      0,
      -1,
      1.5,
      31,
      90,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "17",
      null,
      true,
    ];
    for (const value of rejected) {
      assert.deepEqual(readMetricsRefreshWindowDays(value), { ok: false });
    }
  });
});

describe("X channel sort", () => {
  it("sorts by published time or impressions inside the given list", () => {
    const items = [
      article("old-high", "2026-09-01T00:00:00.000Z", 50),
      article("new-low", "2026-10-01T00:00:00.000Z", 2),
      article("mid-missing", "2026-09-15T00:00:00.000Z", null),
      article("new-zero", "2026-09-30T00:00:00.000Z", 0),
    ];

    assert.deepEqual(
      sortXChannelArticles(items, "latest").map((item) => item.id),
      ["new-low", "new-zero", "mid-missing", "old-high"],
    );
    assert.deepEqual(
      sortXChannelArticles(items, "impressions").map((item) => item.id),
      ["old-high", "new-low", "new-zero", "mid-missing"],
    );
  });
});
