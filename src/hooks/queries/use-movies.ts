import { useQuery } from "@tanstack/react-query";

import { TOPIC_KEY } from "constants/topics";
import type { Option } from "types/option";
import { currentYear } from "utils/dates";

import type { QUERY_ARGS } from "./types";
import { DEFAULT_STALE_TIME, handleError } from "./utils";

const TMDB_API_URL = process.env.EXPO_PUBLIC_TMDB_TMDB_API_URL;
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  popularity: number;
  release_date: string;
  overview: string;
  /** Average user rating (0-10) */
  vote_average: number;
  /** Total number of user ratings */
  vote_count: number;
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  video: boolean;
}

interface TMDBResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

async function getMoviesForYear(year: string): Promise<Movie[]> {
  const { startDate, endDate } = currentYear(year);
  const allMovies: Movie[] = [];
  let page = 1;
  let totalPages = 1;

  // Limit to first 5 pages (100 most popular movies)
  const maxPages = 5;

  while (page <= totalPages && page <= maxPages) {
    const response = await fetch(
      `${TMDB_API_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&language=en-US&page=${page}`,
    );

    if (!response.ok) {
      await handleError("TMDB", response);
    }

    const data: TMDBResponse = await response.json();
    allMovies.push(...data.results);
    totalPages = data.total_pages;
    page++;
  }

  return allMovies;
}

export function formMovieOptions(movies: Movie[]): Option[] {
  return movies.map((movie) => ({
    id: movie.id,
    name: movie.title,
    cover: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    rating: movie.vote_average,
    first_release_date: new Date(movie.release_date).getTime() / 1000,
    summary: movie.overview,
  }));
}

const MOVIES_QUERY_KEY = TOPIC_KEY.MOVIES;

export function useMovies({ key, year }: QUERY_ARGS) {
  const enabled = key === MOVIES_QUERY_KEY;
  return useQuery({
    queryKey: [MOVIES_QUERY_KEY, year],
    queryFn: () => getMoviesForYear(year),
    select: formMovieOptions,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });
}
