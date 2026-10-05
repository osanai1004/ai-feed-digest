import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, type BrowserContext } from "playwright";
import { assertXSession, collectSearch, LoginWallError, readTweetCards } from "./collect.ts";
import { readPickupConfig } from "./config.ts";
import { loadEnvFiles } from "./env.ts";
import { deliverCandidates, toIntakeItem } from "./intakeClient.ts";
import { X_SEARCH_BASES, buildSearchQuery, searchUrl, sinceDateUtc } from "./queries.ts";
import {
  resolveOfficialUrl,
  selectBuzzCandidates,
  type PickupCandidate,
  type RawTweetCard,
  type SelectionDropped,
} from "./rank.ts";
import { loadSession, type XStorageState } from "./session.ts";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const here = path.dirname(fileURLToPath(import.meta.url));

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publicCandidate(candidate: PickupCandidate) {
  return { ...toIntakeItem(candidate), buzzScore: candidate.buzzScore };
}

async function cardsFromFixture(file: string): Promise<RawTweetCard[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const absolute = path.isAbsolute(file) ? file : path.resolve(file);
    await page.goto(pathToFileURL(absolute).href);
    const cards = await readTweetCards(page);
    const publishedAt = new Date().toISOString();
    return cards
      .filter((card) => card.statusHref)
      .map((card, index) => ({
        statusUrl: card.statusHref ?? "",
        text: card.text,
        authorHandle: card.authorHandle,
        publishedAt,
        links: card.links,
        metricText: card.metricText,
        isReply: card.isReply,
        isAd: card.isAd,
        topIndex: index,
      }));
  } finally {
    await browser.close();
  }
}

async function cardsFromX(
  session: XStorageState,
  headless: boolean,
  limit: number,
  maxAgeMs: number,
  now: Date,
): Promise<RawTweetCard[]> {
  const browser = await chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  try {
    const context: BrowserContext = await browser.newContext({
      storageState: session,
      locale: "en-US",
      timezoneId: "Asia/Tokyo",
      viewport: { width: 1280, height: 900 },
      userAgent: USER_AGENT,
    });
    await context.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "media" || type === "font") return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    await assertXSession(page);
    const since = sinceDateUtc(now, maxAgeMs / (60 * 60 * 1000));
    const collected: RawTweetCard[] = [];
    const push = (found: RawTweetCard[]) => {
      for (const card of found) collected.push({ ...card, topIndex: collected.length });
    };
    for (const base of X_SEARCH_BASES) {
      const url = searchUrl(buildSearchQuery(base, since), "top");
      console.error(`search top: ${base.slice(0, 60)}`);
      push(await collectSearch(page, url));
      await delay(1200);
    }
    const firstPass = selectBuzzCandidates(collected, { now, limit, maxAgeMs });
    if (firstPass.candidates.length < Math.min(10, limit)) {
      const liveUrl = searchUrl(buildSearchQuery(X_SEARCH_BASES[0], since), "live");
      console.error("top results were thin; adding latest posts");
      push(await collectSearch(page, liveUrl));
    }
    return collected;
  } finally {
    await browser.close();
  }
}

async function withOfficialUrls(
  candidates: PickupCandidate[],
): Promise<PickupCandidate[]> {
  const resolved: PickupCandidate[] = [];
  for (const candidate of candidates) {
    if (candidate.officialUrl) {
      resolved.push(candidate);
      continue;
    }
    const officialUrl = await resolveOfficialUrl(candidate.links);
    resolved.push({ ...candidate, officialUrl });
  }
  return resolved;
}

function logSelection(collected: number, dropped: SelectionDropped, selected: number) {
  console.error(
    `collected=${collected} selected=${selected} dropped=${JSON.stringify(dropped)}`,
  );
}

async function main(): Promise<void> {
  loadEnvFiles([
    path.join(here, "../../../.env.local"),
    path.join(here, "../../../.env"),
    path.join(here, "../.env"),
  ]);

  let config;
  try {
    config = readPickupConfig(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "invalid config");
    process.exitCode = 1;
    return;
  }

  const now = new Date();
  const maxAgeMs = config.maxAgeHours * 60 * 60 * 1000;
  let cards: RawTweetCard[];
  try {
    if (config.fixtureFile) {
      cards = await cardsFromFixture(config.fixtureFile);
    } else {
      const session = loadSession(process.env);
      if (!session) {
        throw new LoginWallError(
          "No X session. Set X_STORAGE_STATE or both X_AUTH_TOKEN and X_CT0. See workers/x-pickup/README.md.",
        );
      }
      cards = await cardsFromX(session, config.headless, config.limit, maxAgeMs, now);
    }
  } catch (error) {
    if (error instanceof LoginWallError) {
      console.error(error.message);
      process.exitCode = 2;
      return;
    }
    console.error(error instanceof Error ? error.message : "x pickup failed");
    process.exitCode = 1;
    return;
  }

  const selected = selectBuzzCandidates(cards, {
    now,
    limit: config.limit,
    maxAgeMs,
  });
  logSelection(cards.length, selected.dropped, selected.candidates.length);
  const candidates = await withOfficialUrls(selected.candidates);

  if (candidates.length === 0) {
    console.log(
      JSON.stringify({
        dryRun: config.dryRun,
        collected: cards.length,
        dropped: selected.dropped,
        selected: 0,
        candidates: [],
      }),
    );
    return;
  }

  if (config.dryRun || !config.baseUrl || !config.ingestSecret) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          autoApprove: config.autoApprove,
          collected: cards.length,
          dropped: selected.dropped,
          order: "buzzDesc",
          candidates: candidates.map(publicCandidate),
        },
        null,
        2,
      ),
    );
    return;
  }

  try {
    const report = await deliverCandidates({
      baseUrl: config.baseUrl,
      secret: config.ingestSecret,
      candidates,
      autoApprove: config.autoApprove,
    });
    console.log(
      JSON.stringify({
        dryRun: false,
        autoApprove: config.autoApprove,
        collected: cards.length,
        dropped: selected.dropped,
        selected: candidates.length,
        ...report,
        signals: report.signals.map((signal) => ({
          id: signal.id,
          status: signal.status,
          duplicate: signal.duplicate,
          xPostUrl: signal.xPostUrl,
        })),
      }),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "intake post failed");
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "x pickup failed");
  process.exitCode = 1;
});
