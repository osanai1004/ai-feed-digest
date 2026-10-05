import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readPickupConfig } from "./config.ts";

describe("pickup config", () => {
  it("allows a dry run without intake secrets", () => {
    const config = readPickupConfig({ X_PICKUP_DRY_RUN: "1" });
    assert.equal(config.dryRun, true);
    assert.equal(config.autoApprove, false);
    assert.equal(config.limit, 15);
    assert.equal(config.baseUrl, null);
  });

  it("accepts BASE_URL and turns auto-approve on only for an explicit flag", () => {
    const config = readPickupConfig({
      BASE_URL: "https://yoyaku-wakaru.vercel.app/",
      INGEST_SECRET: "test-secret",
      X_PICKUP_AUTO_APPROVE: "true",
      X_PICKUP_LIMIT: "10",
    });
    assert.equal(config.baseUrl, "https://yoyaku-wakaru.vercel.app");
    assert.equal(config.ingestSecret, "test-secret");
    assert.equal(config.autoApprove, true);
    assert.equal(config.limit, 10);
    assert.equal(config.dryRun, false);
  });

  it("rejects a live run that has no destination", () => {
    assert.throws(
      () => readPickupConfig({ X_PICKUP_DRY_RUN: "0" }),
      /INGEST_SECRET/,
    );
    assert.throws(
      () => readPickupConfig({ X_PICKUP_DRY_RUN: "1", X_PICKUP_LIMIT: "21" }),
      /X_PICKUP_LIMIT/,
    );
  });
});
