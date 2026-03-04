import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useAction } from "convex/react";

import { TOPIC_KEY } from "constants/topics";
import type { Option } from "types/option";

import type { QUERY_ARGS } from "./types";
import { DEFAULT_STALE_TIME } from "./utils";

interface Game {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  /** Average IGDB user rating (0-100) */
  rating?: number;
  /** Rating based on external critic scores (0-100) */
  aggregated_rating?: number;
  /** Average rating based on both IGDB user and external critic scores (0-100) */
  total_rating?: number;
  /** Number of total rating votes */
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

const GAMES_QUERY_KEY = TOPIC_KEY.GAMES;

export function useGames({ key, year }: QUERY_ARGS) {
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
}
