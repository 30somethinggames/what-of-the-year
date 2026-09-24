import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import type { Backend } from "types/backend";

import { toSessionId } from "./ids";

export const useMySelections: Backend["useMySelections"] = (sessionId) => {
  const data = useQuery(
    api.selections.getMySelections,
    sessionId ? { sessionId: toSessionId(sessionId) } : "skip",
  );

  return {
    isLoading: data === undefined,
    mySelections: data ?? [],
  };
};
