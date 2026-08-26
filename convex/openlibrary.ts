import { v } from "convex/values";

import { action } from "./_generated/server";
import { fixtureBooks } from "./test/fixtures";

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
  handler: async (_, { year }) => {
    if (process.env.OPTIONS_FIXTURES) return fixtureBooks(year);

    const response = await fetch(
      `https://openlibrary.org/search.json?q=first_publish_year:${year}&sort=rating&limit=40&fields=key,title,first_publish_year,cover_i,ratings_average,description`,
      { headers: { "User-Agent": "WhatOfTheYear/1.0" } },
    );

    if (!response.ok) throw new Error(`Open Library error: ${response.status}`);

    const data: OpenLibraryResponse = await response.json();

    return data.docs;
  },
});
