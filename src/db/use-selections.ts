import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Backend } from "types/backend";

import { toSessionId } from "./ids";

export const useSelections: Backend["useSelections"] = (sessionId, roundNumber) => {
  const selections = useQuery(
    api.selections.getSelections,
    sessionId && roundNumber ? { sessionId: toSessionId(sessionId), number: roundNumber } : "skip",
  );

  return {
    isLoading: selections === undefined,
    selections: selections ?? [],
  };
};

export const useResults: Backend["useResults"] = (sessionId) => {
  const results = useQuery(
    api.selections.getResults,
    sessionId ? { sessionId: toSessionId(sessionId) } : "skip",
  );

  return {
    isLoading: results === undefined,
    results: results ?? [],
  };
};

/** Records the caller's pick for a round. */
export const useSaveSelection: Backend["useSaveSelection"] = () => {
  const save = useMutation(api.selections.saveSelection);
  return ({ sessionId, ...rest }) => save({ sessionId: toSessionId(sessionId), ...rest });
};

/** Replaces the caller's pick for a round that is still open. */
export const useEditSelection: Backend["useEditSelection"] = () => {
  const edit = useMutation(api.selections.editSelection);
  return ({ sessionId, ...rest }) => edit({ sessionId: toSessionId(sessionId), ...rest });
};
