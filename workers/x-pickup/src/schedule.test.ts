import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { pickupCronUtc } from "./schedule.ts";

describe("pickup schedule", () => {
  it("runs 15 minutes before the GAS hours, in UTC", () => {
    const cron = pickupCronUtc();
    assert.equal(cron, "45 2,5,8,11,18,23 * * *");
    const workflow = readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../.github/workflows/x-pickup.yml",
      ),
      "utf8",
    );
    assert.match(workflow, new RegExp(cron.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
