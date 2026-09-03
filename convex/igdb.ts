import { v } from "convex/values";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { Topic } from "./constants";
import { fixtureGames } from "./test/fixtures";
import { requireOptionsAccess } from "./utils/auth";
import {
  IGDB_TOKEN_KEY,
  OPTIONS_TTL_MS,
  optionsKey,
  readCache,
  TOKEN_TTL_SKEW_MS,
  writeCache,
} from "./utils/cache";
import { currentYear } from "./utils/dates";
import { useFixtures } from "./utils/env";

interface Game {
  id: number;
  name: string;
  cover?: { id: number; url: string };
  rating?: number;
  aggregated_rating?: number;
  total_rating?: number;
  total_rating_count?: number;
  first_release_date: number;
  summary?: string;
}

/** Twitch client-credentials tokens live ~60 days; mint one and reuse it. */
async function getAccessToken(ctx: ActionCtx): Promise<string> {
  const cached = await readCache<string>(ctx, IGDB_TOKEN_KEY);
  if (cached) return cached;

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.IGDB_CLIENT_ID!,
      client_secret: process.env.IGDB_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  // internal: plain Error — nothing user-actionable; UI shows its generic load failure
  if (!response.ok) throw new Error(`Twitch OAuth error: ${response.status}`);
  const data = (await response.json()) as { access_token: string; expires_in: number };

  await writeCache(
    ctx,
    IGDB_TOKEN_KEY,
    data.access_token,
    data.expires_in * 1000 - TOKEN_TTL_SKEW_MS,
  );

  return data.access_token;
}

export const getGames = action({
  args: { year: v.string() },
  handler: async (ctx, { year }) => {
    await requireOptionsAccess(ctx, "getGames");

    if (useFixtures()) return fixtureGames(year);

    const key = optionsKey(Topic.GAMES, year);
    const cached = await readCache<Game[]>(ctx, key);
    if (cached) return cached;

    const { startDate, endDate } = currentYear(year);
    const accessToken = await getAccessToken(ctx);

    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `
        fields name, cover.url, rating, aggregated_rating, total_rating, total_rating_count, first_release_date, summary;
        where first_release_date >= ${startDate} & first_release_date < ${endDate}
          & total_rating != null;
        sort total_rating desc;
        limit 500;
      `,
    });

    // internal: plain Error — nothing user-actionable; UI shows its generic load failure
    if (!response.ok) throw new Error(`IGDB error: ${response.status}`);

    const games: Game[] = await response.json();

    await writeCache(ctx, key, games, OPTIONS_TTL_MS);

    return games;
  },
});
