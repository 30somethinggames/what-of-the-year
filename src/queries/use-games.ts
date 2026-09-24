import { useQuery } from "@tanstack/react-query";

import { TOPIC_KEY } from "constants/topics";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";
import type { Backend } from "types/backend";

import { DEFAULT_STALE_TIME } from "./constants";
import { formGameOptions } from "./transforms";

const GAMES_QUERY_KEY = TOPIC_KEY.GAMES;

export const useGames: Backend["useGames"] = ({ key, year }) => {
  const enabled = key === GAMES_QUERY_KEY && !!year;
  const getGames = useAction(api.igdb.getGames);

  return useQuery({
    queryKey: [GAMES_QUERY_KEY, year],
    queryFn: () => getGames({ year: year! }),
    select: formGameOptions,
    staleTime: DEFAULT_STALE_TIME,
    enabled,
    throwOnError: true,
  });
};
