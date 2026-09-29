import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { SessionID } from "db/types";

/**
 * Subscribes to all selections for a given round in real time.
 *
 * Member-only. Every player's selection is listed, so the screen can show who
 * has picked, but each `pick` is null until its round reveals.
 * Automatically skips subscribing if `sessionId` or `roundNumber` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @param roundNumber - The round number. Pass `undefined` to skip subscribing.
 * @returns An object containing the `selections` array and an `isLoading` flag.
 */
export function useSelections(sessionId: SessionID | undefined, roundNumber: number | undefined) {
  const selections = useQuery(
    api.selections.getSelections,
    sessionId && roundNumber ? { sessionId, number: roundNumber } : "skip",
  );

  return {
    isLoading: selections === undefined,
    selections: selections ?? [],
  };
}

/**
 * Subscribes to the session's final standings in real time.
 *
 * Member-only. Only revealed rounds are tallied, so a call mid-game gives
 * nothing away; the session screen reads it once the session has ended.
 * Automatically skips subscribing if `sessionId` is undefined.
 *
 * @param sessionId - The session ID. Pass `undefined` to skip subscribing.
 * @returns An object containing the `results` array and an `isLoading` flag.
 */
export function useResults(sessionId: SessionID | undefined) {
  const results = useQuery(api.selections.getResults, sessionId ? { sessionId } : "skip");

  return {
    isLoading: results === undefined,
    results: results ?? [],
  };
}

/** Member-only: records the caller's pick for a round that is open, where they have none yet. */
export function useSaveSelection() {
  return useMutation(api.selections.saveSelection);
}

/** Member-only: replaces the caller's existing pick for a round that is still open. */
export function useEditSelection() {
  return useMutation(api.selections.editSelection);
}
