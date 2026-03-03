import { action } from "./_generated/server";
import { v } from "convex/values";
import { currentYear } from "./utils/dates";

export const getGames = action({
  args: { year: v.string() },
  handler: async (_, { year }) => {
    const { startDate, endDate } = currentYear(year);

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
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
