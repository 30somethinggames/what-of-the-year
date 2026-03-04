import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";

import { TOPIC_KEY } from "constants/topics";
import type { Option } from "types/option";

import { DEFAULT_STALE_TIME } from "./constants";
import type { QUERY_ARGS } from "./types";

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    publishedDate: string;
    description?: string;
    imageLinks?: { thumbnail?: string };
    averageRating?: number;
  };
}

export function formBookOptions(books: Book[]): Option[] {
  return books.map((book) => ({
    id: typeof book.id === "string" ? parseInt(book.id, 36) : 0,
    name: book.volumeInfo.title,
    cover: book.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
    rating: book.volumeInfo.averageRating ? book.volumeInfo.averageRating * 20 : 0,
    first_release_date: new Date(book.volumeInfo.publishedDate).getTime() / 1000,
    summary: book.volumeInfo.description,
  }));
}

const BOOK_QUERY_KEY = TOPIC_KEY.BOOKS;

export function useBooks({ key, year }: QUERY_ARGS) {
  const enabled = key === BOOK_QUERY_KEY && !!year;
  const getBooks = useAction(api.googlebooks.getBooks);

  return useQuery({
    queryKey: [BOOK_QUERY_KEY, year],
    queryFn: () => getBooks({ year: year! }),
    select: formBookOptions,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
    throwOnError: true,
  });
}
