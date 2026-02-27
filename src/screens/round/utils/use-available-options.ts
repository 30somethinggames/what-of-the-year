import { useMemo } from "react";

import type { MySelection } from "db/hooks/use-my-selections";
import type { Option } from "types/option";

/**
 * Pure function that computes available options by excluding picks the user
 * has already submitted (except the one being edited).
 */
export function computeAvailableOptions(
  options: Option[],
  mySelections: MySelection[],
  editingRound: number | null,
) {
  const pickedIds = new Set(
    mySelections
      .filter((s) => s.roundNumber !== (editingRound ?? -1))
      .map((s) => String(s.pick.id)),
  );

  return options.filter((opt) => !pickedIds.has(String(opt.id)));
}

/** Hook wrapper that memoizes the result for rendering performance. */
export function useAvailableOptions(
  options: Option[],
  mySelections: MySelection[],
  editingRound: number | null,
) {
  return useMemo(
    () => computeAvailableOptions(options, mySelections, editingRound),
    [options, mySelections, editingRound],
  );
}
