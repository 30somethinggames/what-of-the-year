import { useQuery } from "@tanstack/react-query";

import { TOPIC_KEY } from "constants/topics";
import type { Option } from "types/option";
import { currentYear } from "utils/dates";

import type { QUERY_ARGS } from "./types";
import { handleError, DEFAULT_STALE_TIME } from "./utils";

const GOOGLE_BOOKS_API_URL = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_URL;
const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate: string;
    description?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    /** Average user rating (0-5) */
    averageRating?: number;
    /** Total number of user ratings */
    ratingsCount?: number;
    pageCount?: number;
  };
}

interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items: Book[];
}

async function getBooksForYear(yearString: string): Promise<Book[]> {
  const { year } = currentYear(yearString);
  const allBooks: Book[] = [];
  let startIndex = 0;
  const maxResults = 40; // Maximum allowed by API
  const maxPages = 10; // Fetch up to 10 pages (400 books)
  let currentPage = 0;

  while (currentPage < maxPages) {
    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}/volumes?q=publishedDate:${year}&orderBy=newest&maxResults=${maxResults}&startIndex=${startIndex}&key=${GOOGLE_BOOKS_API_KEY}`,
    );

    if (!response.ok) {
      await handleError("Google Books", response);
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      break;
    }

    allBooks.push(...data.items);
    startIndex += maxResults;
    currentPage++;
  }

  return allBooks;
}

export function formBookOptions(books: Book[]): Option[] {
  return books.map((book) => ({
    id: typeof book.id === "string" ? parseInt(book.id, 36) : 0, // Convert string ID to number
    name: book.volumeInfo.title,
    cover: book.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
    rating: book.volumeInfo.averageRating
      ? book.volumeInfo.averageRating * 20 // Convert 0-5 to 0-100 scale
      : 0,
    first_release_date: new Date(book.volumeInfo.publishedDate).getTime() / 1000,
    summary: book.volumeInfo.description,
  }));
}

const BOOK_QUERY_KEY = TOPIC_KEY.BOOKS;

export function useBooks({ key, year }: QUERY_ARGS) {
  const enabled = key === BOOK_QUERY_KEY;
  return useQuery({
    queryKey: [BOOK_QUERY_KEY, year],
    queryFn: () => getBooksForYear(year),
    select: formBookOptions,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });
}
