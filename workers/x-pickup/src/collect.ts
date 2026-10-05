import type { Page } from "playwright";
import type { RawTweetCard } from "./rank.ts";

export class LoginWallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginWallError";
  }
}

export function isLoginWallUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /\/i\/flow\/login|\/login/.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** データセンター IP では X が空の 403 を返すことがある */
export function isBlockedXStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429;
}

const LOGIN_WALL_MESSAGE =
  "X showed a login wall. The stored session is missing or expired. Capture a new session with npm run x:login and rotate X_STORAGE_STATE (or X_AUTH_TOKEN and X_CT0).";

const BLOCKED_MESSAGE =
  "X returned HTTP 403/429. GitHub-hosted runners are often blocked. Set repository variable X_PICKUP_RUNNER to a self-hosted runner that can open https://x.com, or run npm run pickup on that machine.";

async function openX(page: Page, url: string): Promise<void> {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  const status = response?.status() ?? 0;
  if (isBlockedXStatus(status)) {
    throw new LoginWallError(BLOCKED_MESSAGE.replace("403/429", String(status)));
  }
  if (isLoginWallUrl(page.url())) throw new LoginWallError(LOGIN_WALL_MESSAGE);
}

type DomCard = {
  statusHref: string | null;
  text: string;
  authorHandle: string | null;
  publishedAt: string | null;
  links: string[];
  metricText: string;
  isReply: boolean;
  isAd: boolean;
};

export async function assertXSession(page: Page): Promise<void> {
  await openX(page, "https://x.com/home");
  await page.waitForTimeout(1500);
  if (isLoginWallUrl(page.url())) throw new LoginWallError(LOGIN_WALL_MESSAGE);
  const articles = await page.locator("article").count();
  const login = await page
    .locator('[data-testid="loginButton"], a[href="/login"], a[href="/i/flow/login"]')
    .count();
  if (articles === 0 && login > 0) throw new LoginWallError(LOGIN_WALL_MESSAGE);
}

export async function readTweetCards(page: Page): Promise<DomCard[]> {
  return page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll("article"));
    return articles.map((article) => {
      const time = article.querySelector("time");
      const timeHref = time?.closest("a")?.getAttribute("href") ?? null;
      const statusHref =
        timeHref && /\/status\/\d+/.test(timeHref)
          ? timeHref
          : (Array.from(article.querySelectorAll('a[href*="/status/"]'))
              .map((anchor) => anchor.getAttribute("href") ?? "")
              .find((href) => /\/status\/\d+/.test(href)) ?? null);
      const textNode =
        article.querySelector('[data-testid="tweetText"]') ??
        article.querySelector("div[lang]");
      const links = Array.from(article.querySelectorAll("a[href]"))
        .map((anchor) => anchor.getAttribute("href") ?? "")
        .filter(Boolean);
      const labels = Array.from(article.querySelectorAll("[aria-label]"))
        .map((element) => element.getAttribute("aria-label") ?? "")
        .filter(Boolean);
      const groupLabel =
        article.querySelector('[role="group"]')?.getAttribute("aria-label") ?? "";
      const context =
        article.querySelector('[data-testid="socialContext"]')?.textContent ?? "";
      const handle = statusHref?.match(/\/([^/]+)\/status\/\d+/)?.[1] ?? null;
      return {
        statusHref,
        text: textNode?.textContent?.trim() ?? "",
        authorHandle: handle,
        publishedAt: time?.getAttribute("datetime") ?? null,
        links,
        metricText: [groupLabel, ...labels].filter(Boolean).join(" | "),
        isReply: /replying to|返信先/i.test(context),
        isAd: /promoted|広告|プロモ/i.test(context),
      };
    });
  });
}

export async function collectSearch(page: Page, url: string): Promise<RawTweetCard[]> {
  await openX(page, url);
  await page.waitForTimeout(1500);
  if (isLoginWallUrl(page.url())) throw new LoginWallError(LOGIN_WALL_MESSAGE);
  await page
    .waitForSelector("article", { timeout: 20_000 })
    .catch(() => undefined);
  for (let i = 0; i < 3; i += 1) {
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(800);
  }
  if (isLoginWallUrl(page.url())) throw new LoginWallError(LOGIN_WALL_MESSAGE);
  const cards = await readTweetCards(page);
  return cards
    .filter((card) => card.statusHref)
    .map((card) => ({
      statusUrl: card.statusHref ?? "",
      text: card.text,
      authorHandle: card.authorHandle,
      publishedAt: card.publishedAt,
      links: card.links,
      metricText: card.metricText,
      isReply: card.isReply,
      isAd: card.isAd,
      topIndex: 0,
    }));
}
