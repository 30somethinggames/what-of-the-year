import { afterAll, beforeEach, describe, expect, it } from "bun:test";

import { api } from "../_generated/api";
import { optionsKey } from "../utils/cache";
import { MEMBER_UID, OUTSIDER_UID, setupTest } from "./harness.setup";

// The actions must take the real third-party path, not the fixture shortcut.
delete process.env.OPTIONS_FIXTURES;

const mockMovie = {
  id: 1,
  title: "Sinners",
  poster_path: "/sinners.jpg",
  vote_average: 7.6,
  release_date: "2025-03-07",
  overview: "Twin brothers return home.",
};

const mockGame = {
  id: 2,
  name: "Blue Prince",
  total_rating: 91,
  first_release_date: 1_744_000_000,
  summary: "A house of many doors.",
};

const mockBook = {
  key: "/works/OL1W",
  title: "The Emperor of Gladness",
  first_publish_year: 2025,
  cover_i: 42,
  ratings_average: 4.5,
  description: "A year in a dying town.",
};

const realFetch = globalThis.fetch;

let requests: string[] = [];

/** Set by the oversized-payload test; the IGDB mock serves this when present. */
let oversizedGames: (typeof mockGame)[] | null = null;

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(input: string | URL | Request) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  requests.push(url);

  if (url.includes("api.themoviedb.org"))
    return Promise.resolve(json({ page: 1, total_pages: 1, results: [mockMovie] }));
  if (url.includes("id.twitch.tv"))
    return Promise.resolve(json({ access_token: "twitch-token", expires_in: 5_000_000 }));
  if (url.includes("api.igdb.com")) return Promise.resolve(json(oversizedGames ?? [mockGame]));
  if (url.includes("openlibrary.org"))
    return Promise.resolve(json({ numFound: 1, docs: [mockBook] }));

  throw new Error(`Unexpected fetch: ${url}`);
}

/** How many times the mock was asked for `host`. */
function hits(host: string) {
  return requests.filter((url) => url.includes(host)).length;
}

beforeEach(() => {
  requests = [];
  oversizedGames = null;
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

describe("option actions", () => {
  it("throw when unauthenticated and call no third-party API", async () => {
    const t = await setupTest();

    await expect(t.action(api.tmdb.getMovies, { year: "2025" })).rejects.toThrow(/UNAUTHENTICATED/);
    await expect(t.action(api.igdb.getGames, { year: "2025" })).rejects.toThrow(/UNAUTHENTICATED/);
    await expect(t.action(api.openlibrary.getBooks, { year: "2025" })).rejects.toThrow(
      /UNAUTHENTICATED/,
    );

    expect(requests).toEqual([]);
  });

  it("throw once the caller's rate-limit bucket is empty, per user", async () => {
    const t = await setupTest();
    const asMember = t.withIdentity({ subject: MEMBER_UID });

    for (let i = 0; i < 10; i++) {
      await asMember.action(api.openlibrary.getBooks, { year: "2025" });
    }

    await expect(asMember.action(api.openlibrary.getBooks, { year: "2025" })).rejects.toThrow(
      /RateLimited/,
    );

    // A different user has their own bucket.
    expect(
      await t.withIdentity({ subject: OUTSIDER_UID }).action(api.openlibrary.getBooks, {
        year: "2025",
      }),
    ).toEqual([mockBook]);
  });
});

describe("option caching", () => {
  it("fetches movies once per year and serves repeats from the cache", async () => {
    const t = await setupTest();
    const asMember = t.withIdentity({ subject: MEMBER_UID });

    const first = await asMember.action(api.tmdb.getMovies, { year: "2025" });
    const second = await asMember.action(api.tmdb.getMovies, { year: "2025" });

    expect(first).toEqual([mockMovie]);
    expect(second).toEqual([mockMovie]);
    expect(hits("api.themoviedb.org")).toBe(1);

    await asMember.action(api.tmdb.getMovies, { year: "2024" });

    expect(hits("api.themoviedb.org")).toBe(2);
  });

  it("fetches books once per year and serves repeats from the cache", async () => {
    const t = await setupTest();
    const asMember = t.withIdentity({ subject: MEMBER_UID });

    expect(await asMember.action(api.openlibrary.getBooks, { year: "2025" })).toEqual([mockBook]);
    expect(await asMember.action(api.openlibrary.getBooks, { year: "2025" })).toEqual([mockBook]);

    expect(hits("openlibrary.org")).toBe(1);
  });

  it("reuses the Twitch token across IGDB fetches for different years", async () => {
    const t = await setupTest();
    const asMember = t.withIdentity({ subject: MEMBER_UID });

    expect(await asMember.action(api.igdb.getGames, { year: "2025" })).toEqual([mockGame]);
    await asMember.action(api.igdb.getGames, { year: "2024" });
    await asMember.action(api.igdb.getGames, { year: "2025" });

    expect(hits("api.igdb.com")).toBe(2);
    expect(hits("id.twitch.tv")).toBe(1);
  });

  it("serves but does not cache a payload too large for a Convex document", async () => {
    const t = await setupTest();
    const asMember = t.withIdentity({ subject: MEMBER_UID });
    // Bigger than the 900KB write ceiling in `utils/cache`.
    oversizedGames = Array.from({ length: 20 }, (_, i) => ({
      ...mockGame,
      id: i,
      summary: "x".repeat(50_000),
    }));

    await asMember.action(api.igdb.getGames, { year: "2025" });
    await asMember.action(api.igdb.getGames, { year: "2025" });

    expect(hits("api.igdb.com")).toBe(2);
    expect(await t.run(async (ctx) => await ctx.db.query("apiCache").collect())).toHaveLength(1);
  });

  it("refetches once the cached entry has expired", async () => {
    const t = await setupTest();
    const asMember = t.withIdentity({ subject: MEMBER_UID });

    await asMember.action(api.tmdb.getMovies, { year: "2025" });

    await t.run(async (ctx) => {
      const entry = await ctx.db
        .query("apiCache")
        .withIndex("by_key", (q) => q.eq("key", optionsKey("movies", "2025")))
        .unique();
      await ctx.db.patch(entry!._id, { expiresAt: Date.now() - 1 });
    });

    expect(await asMember.action(api.tmdb.getMovies, { year: "2025" })).toEqual([mockMovie]);
    expect(hits("api.themoviedb.org")).toBe(2);
  });
});
