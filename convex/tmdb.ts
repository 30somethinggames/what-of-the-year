import { v } from "convex/values";

import { action } from "./_generated/server";
import { Topic } from "./constants";
import { fixtureMovies } from "./test/fixtures";
import { requireOptionsAccess } from "./utils/auth";
import { OPTIONS_TTL_MS, optionsKey, readCache, writeCache } from "./utils/cache";
import { useFixtures } from "./utils/env";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
}

interface TMDBResponse {
  page: number;
  results: Movie[];
  total_pages: number;
}

export const getMovies = action({
  args: { year: v.string() },
  handler: async (ctx, { year }) => {
    await requireOptionsAccess(ctx, "getMovies");

    if (useFixtures()) return fixtureMovies(year);

    const key = optionsKey(Topic.MOVIES, year);
    const cached = await readCache<Movie[]>(ctx, key);
    if (cached) return cached;

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const allMovies: Movie[] = [];
    let page = 1;
    let totalPages = 1;
    const maxPages = 5;

    while (page <= totalPages && page <= maxPages) {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&language=en-US&page=${page}`,
      );

      // internal: plain Error — nothing user-actionable; UI shows its generic load failure
      if (!response.ok) throw new Error(`TMDB error: ${response.status}`);

      const data: TMDBResponse = await response.json();
      allMovies.push(...data.results);
      totalPages = data.total_pages;
      page++;
    }

    await writeCache(ctx, key, allMovies, OPTIONS_TTL_MS);

    return allMovies;
  },
});
