import { v } from "convex/values";

import { action } from "./_generated/server";
import { Topic } from "./constants";
import { fixtureBooks } from "./test/fixtures";
import { requireOptionsAccess } from "./utils/auth";
import { OPTIONS_TTL_MS, optionsKey, readCache, writeCache } from "./utils/cache";
import { parseYear } from "./utils/dates";
import { useFixtures } from "./utils/env";

interface OpenLibraryBook {
  key: string;
  title: string;
  first_publish_year?: number;
  cover_i?: number;
  ratings_average?: number;
  description?: string;
}

interface OpenLibraryResponse {
  numFound: number;
  docs: OpenLibraryBook[];
}

export const getBooks = action({
  args: { year: v.string() },
  handler: async (ctx, { year }) => {
    await requireOptionsAccess(ctx, "getBooks");
    const publishYear = parseYear(year);

    if (useFixtures()) return fixtureBooks(year);

    const key = optionsKey(Topic.BOOKS, publishYear);
    const cached = await readCache<OpenLibraryBook[]>(ctx, key);
    if (cached) return cached;

    const response = await fetch(
      `https://openlibrary.org/search.json?q=first_publish_year:${publishYear}&sort=rating&limit=40&fields=key,title,first_publish_year,cover_i,ratings_average,description`,
      { headers: { "User-Agent": "WhatOfTheYear/1.0" } },
    );

    // internal: plain Error — nothing user-actionable; UI shows its generic load failure
    if (!response.ok) throw new Error(`Open Library error: ${response.status}`);

    const data: OpenLibraryResponse = await response.json();

    await writeCache(ctx, key, data.docs, OPTIONS_TTL_MS);

    return data.docs;
  },
});
