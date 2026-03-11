import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";

import { TOPIC_KEY } from "constants/topics";

import { DEFAULT_STALE_TIME } from "./constants";
import { formMovieOptions } from "./transforms";
import type { QUERY_ARGS } from "./types";

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
