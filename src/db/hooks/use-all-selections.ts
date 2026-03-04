import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useAllSelections(sessionId: string | undefined) {
  const selections = useQuery(
    api.selections.getAllSelections,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip",
  );

  return {
    allSelections: selections ?? [],
    isLoading: selections === undefined,
  };
}
