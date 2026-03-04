import { router } from "expo-router";
import { useEffect } from "react";

import { useMySelections } from "db/hooks/use-my-selections";
import { useRound } from "db/hooks/use-round";
import { useSelections } from "db/hooks/use-selections";
import { useSession } from "db/hooks/use-sessions";
import type { SessionID } from "db/types";

interface Props {
  sessionId: SessionID;
  topic: string;
  year: string;
}

export function useRoundState({ sessionId, topic, year }: Props) {
  const { isLoading: sessionLoading, session, activeRound } = useSession(sessionId);
  const { isLoading: roundLoading, round } = useRound(sessionId, activeRound);
  const { isLoading: selectionsLoading, selections } = useSelections(sessionId, activeRound);
  const { isLoading: mySelectionsLoading, mySelections, uid } = useMySelections(sessionId);

  const isLoading = sessionLoading || roundLoading || selectionsLoading || mySelectionsLoading;

  // Keep URL param in sync for deep linking
  useEffect(() => {
    if (activeRound) router.setParams({ round: String(activeRound) });
  }, [activeRound]);

  // Navigate to results when last round closes
  useEffect(() => {
    if (!round || !activeRound) return;
    if (activeRound === 1 && round.number === 1 && round.state === "closed") {
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]/results",
        params: { topic, year, sessionId },
      } as never);
    }
  }, [round?.number, round?.state, activeRound, sessionId, topic, year]);

  const completedUids = new Set(selections.map((s) => s.uid));
  const hasPickedThisRound = activeRound
    ? mySelections.some((s) => s.roundNumber === activeRound)
    : false;

  return {
    isLoading,
    session,
    round,
    activeRound,
    completedUids,
    mySelections,
    uid,
    hasPickedThisRound,
  };
}
