import { createInterface } from "node:readline";
import { chmodSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { loadEnvFiles } from "./env.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

function waitForEnter(prompt: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function fillLogin(page: Page): Promise<void> {
  const username = process.env.X_USERNAME?.trim();
  const password = process.env.X_PASSWORD?.trim();
  if (!username || !password) return;
  try {
    const userBox = page.locator('input[autocomplete="username"], input[name="text"]').first();
    await userBox.waitFor({ timeout: 15_000 });
    await userBox.fill(username);
    await page.getByRole("button", { name: /next|次へ/i }).click();
    const passwordBox = page.locator('input[name="password"], input[type="password"]').first();
    await passwordBox.waitFor({ timeout: 15_000 });
    await passwordBox.fill(password);
    await page.getByRole("button", { name: /log in|ログイン/i }).click();
  } catch {
    console.error("自動入力は途中で止まった。画面でログインを続けてください。");
  }
}

async function main(): Promise<void> {
  loadEnvFiles([
    path.join(here, "../../../.env.local"),
    path.join(here, "../../../.env"),
    path.join(here, "../.env"),
  ]);

  const out = path.resolve(
    process.env.X_STORAGE_STATE_PATH?.trim() ||
      path.join(here, "../secrets/x-storage-state.json"),
  );
  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({
      locale: "en-US",
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded" });
    await fillLogin(page);
    console.error("ブラウザで X にログインし、ホームのタイムラインが見えたら Enter を押してください。");
    console.error("二段階認証が出た場合も、画面で済ませてから Enter です。");
    await waitForEnter("");
    mkdirSync(path.dirname(out), { recursive: true });
    await context.storageState({ path: out });
    chmodSync(out, 0o600);
    console.error(`セッションを保存しました: ${out}`);
    console.error("このファイルは Git に含めないでください。中身を GitHub Actions の secret X_STORAGE_STATE に貼ります。");
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "login failed");
  process.exitCode = 1;
});
