import type { Option } from "types/option";

export interface Book {
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

export interface Game {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  rating?: number;
  aggregated_rating?: number;
  total_rating?: number;
  total_rating_count?: number;
  first_release_date: number;
  summary?: string;
}

export function formGameOptions(games: Game[]): Option[] {
  return games.map((game) => ({
    id: game.id,
    name: game.name,
    cover: game.cover?.url,
    rating: game.total_rating ?? 0,
    first_release_date: game.first_release_date,
    summary: game.summary,
  }));
}

export function formMovieOptions(
  movies: {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
    release_date: string;
    overview: string;
  }[],
): Option[] {
  return movies.map((movie) => ({
    id: movie.id,
    name: movie.title,
    cover: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    rating: movie.vote_average,
    first_release_date: new Date(movie.release_date).getTime() / 1000,
    summary: movie.overview,
  }));
}
