import { useQuery } from "@tanstack/react-query";

import { TOPIC_KEY } from "constants/topics";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";
import type { Backend } from "types/backend";

import { DEFAULT_STALE_TIME } from "./constants";
import { formMovieOptions } from "./transforms";

const MOVIES_QUERY_KEY = TOPIC_KEY.MOVIES;

export const useMovies: Backend["useMovies"] = ({ key, year }) => {
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
};
