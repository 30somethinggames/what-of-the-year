import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";

import { TOPIC_KEY } from "constants/topics";
import type { Option } from "types/option";

import { DEFAULT_STALE_TIME } from "./constants";
import type { QUERY_ARGS } from "./types";

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

const MOVIES_QUERY_KEY = TOPIC_KEY.MOVIES;

export function useMovies({ key, year }: QUERY_ARGS) {
  const enabled = key === MOVIES_QUERY_KEY && !!year;
  const getMovies = useAction(api.tmdb.getMovies);

  return useQuery({
    queryKey: [MOVIES_QUERY_KEY, year],
    queryFn: () => getMovies({ year: year! }),
    select: formMovieOptions,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
    throwOnError: true,
  });
}
