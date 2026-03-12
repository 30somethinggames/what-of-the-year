import type { Option } from "types/option";

interface Book {
  key: string;
  title: string;
  first_publish_year?: number;
  cover_i?: number;
  ratings_average?: number;
  description?: string;
}

export function formBookOptions(books: Book[]): Option[] {
  return books.map((book) => ({
    id: book.cover_i ?? (parseInt(book.key.replace(/\D/g, ""), 10) || 0),
    name: book.title,
    cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
    rating: book.ratings_average ? book.ratings_average * 20 : 0,
    first_release_date: book.first_publish_year ?? 0,
    summary: book.description,
  }));
}

interface Game {
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

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
}

export function formMovieOptions(movies: Movie[]): Option[] {
  return movies.map((movie) => ({
    id: movie.id,
    name: movie.title,
    cover: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    rating: movie.vote_average * 10,
    first_release_date: new Date(movie.release_date).getTime() / 1000,
    summary: movie.overview,
  }));
}
