import { readFileSync } from "node:fs";

export type XStorageState = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Strict" | "Lax" | "None";
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

function parseStorageState(raw: string): XStorageState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("X session JSON could not be parsed. Rotate X_STORAGE_STATE.");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { cookies?: unknown }).cookies)
  ) {
    throw new Error("X session JSON is missing cookies. Rotate X_STORAGE_STATE.");
  }
  const state = parsed as XStorageState;
  if (!Array.isArray(state.origins)) state.origins = [];
  return state;
}

function cookie(
  name: string,
  value: string,
  domain: string,
  httpOnly: boolean,
): XStorageState["cookies"][number] {
  return {
    name,
    value,
    domain,
    path: "/",
    expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    httpOnly,
    secure: true,
    sameSite: "None",
  };
}

export function cookiesFromPair(authToken: string, ct0: string): XStorageState {
  const domains = [".x.com", ".twitter.com"];
  const cookies = domains.flatMap((domain) => [
    cookie("auth_token", authToken, domain, true),
    cookie("ct0", ct0, domain, false),
  ]);
  return { cookies, origins: [] };
}

/**
 * セッションの優先順: ファイル、JSON 文字列、auth_token + ct0。
 * 値そのものはログに出さない。
 */
export function loadSession(
  env: Record<string, string | undefined>,
): XStorageState | null {
  const pathValue = env.X_STORAGE_STATE_PATH?.trim();
  if (pathValue) return parseStorageState(readFileSync(pathValue, "utf8"));
  const raw = env.X_STORAGE_STATE?.trim();
  if (raw) return parseStorageState(raw);
  const auth = env.X_AUTH_TOKEN?.trim();
  const ct0 = env.X_CT0?.trim();
  if (auth && ct0) return cookiesFromPair(auth, ct0);
  if (auth || ct0) {
    throw new Error("Set both X_AUTH_TOKEN and X_CT0, or use X_STORAGE_STATE.");
  }
  return null;
}
