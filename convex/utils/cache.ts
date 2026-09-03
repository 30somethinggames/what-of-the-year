import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { TopicKey } from "../constants";

/** Option lists for a finished year barely move; a day is plenty. */
export const OPTIONS_TTL_MS = 24 * 60 * 60 * 1000;

/** Refresh the IGDB token this far before it actually expires. */
export const TOKEN_TTL_SKEW_MS = 5 * 60 * 1000;

export function optionsKey(topic: TopicKey, year: string) {
  return `options:${topic}:${year}`;
}

export const IGDB_TOKEN_KEY = "igdb:access-token";

/** The cached value for `key`, or `null` when absent or expired. */
export async function readCache<T>(ctx: ActionCtx, key: string): Promise<T | null> {
  return (await ctx.runQuery(internal.cache.read, { key })) as T | null;
}

/** Convex caps a document at 1MB; a payload over this is served but not cached. */
const MAX_CACHED_BYTES = 900_000;

/**
 * Store `value` under `key` for `ttlMs`. Caching is best-effort: an expired TTL
 * or an oversized payload is skipped rather than failing the caller's fetch.
 */
export async function writeCache(ctx: ActionCtx, key: string, value: unknown, ttlMs: number) {
  if (ttlMs <= 0) return;
  if (JSON.stringify(value).length > MAX_CACHED_BYTES) return;

  await ctx.runMutation(internal.cache.write, { key, value, expiresAt: Date.now() + ttlMs });
}
