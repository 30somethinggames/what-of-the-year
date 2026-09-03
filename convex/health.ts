import type { ActionCtx } from "./_generated/server";
import { httpAction } from "./_generated/server";
import { igdbQuery } from "./igdb";
import { rateLimiter } from "./ratelimits";

type ProbeResult = { ok: true } | { ok: false; error: string };

/**
 * The cheapest call to each upstream that still exercises the deployment's
 * real credentials and the response shape the option actions rely on. Bypasses
 * the options cache on purpose — a cache hit proves nothing about the keys.
 */
const probes: Record<string, (ctx: ActionCtx) => Promise<void>> = {
  async tmdb() {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&page=1`,
    );
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);

    const data = (await response.json()) as { results?: unknown };
    if (!Array.isArray(data.results) || data.results.length === 0)
      throw new Error("TMDB returned no results");
  },

  async igdb(ctx) {
    const response = await igdbQuery(ctx, "fields name; limit 1;");
    if (!response.ok) throw new Error(`IGDB error: ${response.status}`);

    const games = (await response.json()) as unknown;
    if (!Array.isArray(games) || games.length === 0) throw new Error("IGDB returned no games");
  },

  async openlibrary() {
    // A bare-word `q` is rejected as a stopword query; mirror the option
    // action's field query for a year that is certainly finished.
    const lastYear = new Date().getFullYear() - 1;
    const response = await fetch(
      `https://openlibrary.org/search.json?q=first_publish_year:${lastYear}&limit=1&fields=key`,
      { headers: { "User-Agent": "WhatOfTheYear/1.0" } },
    );
    if (!response.ok) throw new Error(`Open Library error: ${response.status}`);

    const data = (await response.json()) as { docs?: unknown };
    if (!Array.isArray(data.docs) || data.docs.length === 0)
      throw new Error("Open Library returned no docs");
  },
};

async function runProbe(
  ctx: ActionCtx,
  [name, probe]: [string, (ctx: ActionCtx) => Promise<void>],
): Promise<[string, ProbeResult]> {
  try {
    await probe(ctx);
    return [name, { ok: true }];
  } catch (error) {
    return [name, { ok: false, error: error instanceof Error ? error.message : String(error) }];
  }
}

/**
 * `GET /health/upstreams`: hits TMDB, IGDB (via Twitch OAuth) and Open Library
 * with the deployment's own keys and reports per-API status — 200 when every
 * probe passes, 503 naming the failures otherwise. Unauthenticated so a
 * scheduled curl can call it without a shared secret; the global rate limit
 * keeps it from being a lever on third-party quota.
 */
export const upstreams = httpAction(async (ctx) => {
  const { ok, retryAfter } = await rateLimiter.limit(ctx, "healthUpstreams");
  if (!ok)
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) },
    });

  const results = Object.fromEntries(
    await Promise.all(Object.entries(probes).map((probe) => runProbe(ctx, probe))),
  );
  const healthy = Object.values(results).every((result) => result.ok);

  return new Response(JSON.stringify(results), {
    status: healthy ? 200 : 503,
    headers: { "Content-Type": "application/json" },
  });
});
