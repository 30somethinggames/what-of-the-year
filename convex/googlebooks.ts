import { v } from "convex/values";

import { action } from "./_generated/server";

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    publishedDate: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
    averageRating?: number;
  };
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: Book[];
}

export const getBooks = action({
  args: { year: v.string() },
  handler: async (_, { year }) => {
    const allBooks: Book[] = [];
    let startIndex = 0;
    const maxResults = 40;
    const maxPages = 10;
    let currentPage = 0;

    while (currentPage < maxPages) {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=publishedDate:${year}&orderBy=newest&maxResults=${maxResults}&startIndex=${startIndex}&key=${process.env.GOOGLE_BOOKS_API_KEY}`,
      );

      if (!response.ok) throw new Error(`Google Books error: ${response.status}`);

      const data: GoogleBooksResponse = await response.json();

      if (!data.items || data.items.length === 0) break;

      allBooks.push(...data.items);
      startIndex += maxResults;
      currentPage++;
    }

    return allBooks;
  },
});
