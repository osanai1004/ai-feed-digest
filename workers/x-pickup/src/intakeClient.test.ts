import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { deliverCandidates } from "./intakeClient.ts";
import type { PickupCandidate } from "./rank.ts";

function candidate(id: string, buzzScore: number): PickupCandidate {
  return {
    xPostUrl: `https://x.com/openai/status/${id}`,
    text: "OpenAI published a new model for the API today.",
    title: "OpenAI published a new model for the API today.",
    source: "OpenAI",
    author: "@openai",
    publishedAt: "2026-10-04T12:00:00.000Z",
    officialUrl: "https://openai.com/index/new-model",
    links: [],
    buzzScore,
    impressions: buzzScore,
    likes: 10,
    reposts: 2,
  };
}

type Hit = { url: string; auth: string; body: Record<string, unknown> };

async function listen(): Promise<{ server: Server; baseUrl: string; hits: Hit[] }> {
  const hits: Hit[] = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString() || "{}") as Record<
        string,
        unknown
      >;
      const url = req.url ?? "";
      hits.push({ url, auth: req.headers.authorization ?? "", body });
      if (url === "/api/intake") {
        const xPostUrl = String(body.xPostUrl);
        const duplicate = xPostUrl.endsWith("/9");
        res.writeHead(201, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            signals: [
              {
                id: xPostUrl.endsWith("/2") ? "s_bbbbbbbbbbbbbbbb" : "s_aaaaaaaaaaaaaaaa",
                status: "pending_review",
                duplicate,
                officialUrl: body.officialUrl ?? null,
                xPostUrl,
              },
            ],
          }),
        );
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${address.port}`, hits };
}

describe("intake delivery", () => {
  it("posts low buzz first and approves only new pending rows when asked", async () => {
    const { server, baseUrl, hits } = await listen();
    try {
      const report = await deliverCandidates({
        baseUrl,
        secret: "test-secret",
        candidates: [candidate("1", 100), candidate("2", 10)],
        autoApprove: true,
        pause: async () => undefined,
      });
      assert.deepEqual(
        hits.filter((hit) => hit.url === "/api/intake").map((hit) => hit.body.xPostUrl),
        ["https://x.com/openai/status/2", "https://x.com/openai/status/1"],
      );
      assert.equal(hits.every((hit) => hit.auth === "Bearer test-secret"), true);
      assert.equal(hits[0].body.officialUrl, "https://openai.com/index/new-model");
      assert.equal(hits.filter((hit) => hit.url.startsWith("/api/intake/s_")).length, 2);
      assert.equal(report.approved, 2);
      assert.equal(report.pendingReview, 0);
      assert.equal(report.signals.every((signal) => signal.status === "ready"), true);

      hits.length = 0;
      const skipped = await deliverCandidates({
        baseUrl,
        secret: "test-secret",
        candidates: [candidate("9", 50)],
        autoApprove: true,
        pause: async () => undefined,
      });
      assert.equal(skipped.approved, 0);
      assert.equal(skipped.duplicates, 1);
      assert.equal(hits.some((hit) => hit.url.includes("/s_")), false);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
