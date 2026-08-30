import { v } from "convex/values";

import { action } from "./_generated/server";
import { fixtureGames } from "./test/fixtures";
import { currentYear } from "./utils/dates";
import { useFixtures } from "./utils/env";

async function getAccessToken(): Promise<string> {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.IGDB_CLIENT_ID!,
      client_secret: process.env.IGDB_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) throw new Error(`Twitch OAuth error: ${response.status}`);
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export const getGames = action({
  args: { year: v.string() },
  handler: async (_, { year }) => {
    if (useFixtures()) return fixtureGames(year);

    const { startDate, endDate } = currentYear(year);
    const accessToken = await getAccessToken();

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

    if (!response.ok) throw new Error(`IGDB error: ${response.status}`);
    return response.json();
  },
});
