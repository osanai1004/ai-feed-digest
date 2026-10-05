import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cookiesFromPair, loadSession } from "./session.ts";

describe("X session", () => {
  it("builds cookies from auth_token and ct0 without echoing them back in errors", () => {
    const state = cookiesFromPair("auth-token-test", "ct0-test");
    assert.equal(state.cookies.some((cookie) => cookie.name === "auth_token"), true);
    assert.equal(state.cookies.some((cookie) => cookie.domain === ".x.com"), true);
    assert.throws(
      () => loadSession({ X_STORAGE_STATE: "not-json" }),
      /could not be parsed/,
    );
    assert.throws(
      () => loadSession({ X_AUTH_TOKEN: "only-one" }),
      /both X_AUTH_TOKEN and X_CT0/,
    );
    assert.equal(loadSession({}), null);
  });
});
