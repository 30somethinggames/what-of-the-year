import { afterAll, beforeEach, describe, expect, it } from "bun:test";

import { IGDB_TOKEN_KEY } from "../utils/cache";
import { setupTest } from "./harness.setup";

const HEALTH_PATH = "/health/upstreams";

/** A cached token IGDB no longer honours. */
const STALE_TOKEN = "stale-token";

const realFetch = globalThis.fetch;

let requests: string[] = [];

/** Per-host overrides for a failing upstream, keyed by hostname fragment. */
let failures: Record<string, Response> = {};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(input: string | URL | Request, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  requests.push(url);

  const failure = Object.entries(failures).find(([host]) => url.includes(host))?.[1];
  if (failure) return Promise.resolve(failure.clone());

  if (url.includes("api.themoviedb.org"))
    return Promise.resolve(json({ page: 1, total_pages: 1, results: [{ id: 1 }] }));
  if (url.includes("id.twitch.tv"))
    return Promise.resolve(json({ access_token: "twitch-token", expires_in: 5_000_000 }));
  if (url.includes("api.igdb.com")) {
    const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
    if (auth === `Bearer ${STALE_TOKEN}`) return Promise.resolve(new Response("", { status: 401 }));

    return Promise.resolve(json([{ id: 2, name: "Blue Prince" }]));
  }
  if (url.includes("openlibrary.org"))
    return Promise.resolve(json({ numFound: 1, docs: [{ key: "/works/OL1W" }] }));

  throw new Error(`Unexpected fetch: ${url}`);
}

/** How many times the mock was asked for `host`. */
function hits(host: string) {
  return requests.filter((url) => url.includes(host)).length;
}

beforeEach(() => {
  requests = [];
  failures = {};
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

describe("GET /health/upstreams", () => {
  it("returns 200 with every probe ok when the upstreams answer", async () => {
    const t = await setupTest();

    const response = await t.fetch(HEALTH_PATH);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tmdb: { ok: true },
      igdb: { ok: true },
      openlibrary: { ok: true },
    });
    expect(hits("api.themoviedb.org")).toBe(1);
    expect(hits("id.twitch.tv")).toBe(1);
    expect(hits("api.igdb.com")).toBe(1);
    expect(hits("openlibrary.org")).toBe(1);
  });

  it("returns 503 naming the failing API when a key is rejected", async () => {
    const t = await setupTest();
    failures = { "api.themoviedb.org": new Response("", { status: 401 }) };

    const response = await t.fetch(HEALTH_PATH);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      tmdb: { ok: false, error: "TMDB error: 401" },
      igdb: { ok: true },
      openlibrary: { ok: true },
    });
  });

  it("returns 503 when Twitch refuses to mint a token", async () => {
    const t = await setupTest();
    failures = { "id.twitch.tv": new Response("", { status: 403 }) };

    const response = await t.fetch(HEALTH_PATH);

    expect(response.status).toBe(503);
    expect(((await response.json()) as { igdb: unknown }).igdb).toEqual({
      ok: false,
      error: "Twitch OAuth error: 403",
    });
    expect(hits("api.igdb.com")).toBe(0);
  });

  it("returns 503 when an upstream answers 200 with an unexpected shape", async () => {
    const t = await setupTest();
    failures = { "openlibrary.org": json({ numFound: 0, docs: [] }) };

    const response = await t.fetch(HEALTH_PATH);

    expect(response.status).toBe(503);
    expect(((await response.json()) as { openlibrary: unknown }).openlibrary).toEqual({
      ok: false,
      error: "Open Library returned no docs",
    });
  });

  it("re-mints the IGDB token when the cached one is rejected", async () => {
    const t = await setupTest();
    await t.run(async (ctx) => {
      await ctx.db.insert("apiCache", {
        key: IGDB_TOKEN_KEY,
        value: STALE_TOKEN,
        expiresAt: Date.now() + 60_000,
      });
    });

    const response = await t.fetch(HEALTH_PATH);

    expect(response.status).toBe(200);
    expect(hits("api.igdb.com")).toBe(2);
    expect(hits("id.twitch.tv")).toBe(1);
  });

  it("returns 429 once the global bucket is empty and calls no upstream", async () => {
    const t = await setupTest();

    for (let i = 0; i < 6; i++) {
      expect((await t.fetch(HEALTH_PATH)).status).toBe(200);
    }
    requests = [];

    const response = await t.fetch(HEALTH_PATH);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(requests).toEqual([]);
  });
});
