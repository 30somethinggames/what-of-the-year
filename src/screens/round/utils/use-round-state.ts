import { router } from "expo-router";
import { useEffect, useRef } from "react";

import { useMySelections } from "db/hooks/use-my-selections";
import { usePlayers } from "db/hooks/use-players";
import { useRound } from "db/hooks/use-round";
import { useSelections } from "db/hooks/use-selections";
import { useSession } from "db/hooks/use-sessions";
import type { SessionID } from "db/types";
import { advanceRound } from "db/utils/advance-round";

interface Props {
  sessionId: SessionID;
  topic: string;
  year: string;
}
export function useRoundState({ sessionId, topic, year }: Props) {
  const { session, isLoading: sessionLoading, isError: sessionError } = useSession(sessionId);

  // activeRoundNumber is the source of truth — no URL navigation needed
  const activeRound = session?.activeRoundNumber;

  // Keep URL param in sync for deep linking (no navigation transition)
  useEffect(() => {
    if (activeRound) {
      router.setParams({ round: String(activeRound) });
    }
  }, [activeRound]);

  const { round, isLoading: roundLoading, isError: roundError } = useRound(sessionId, activeRound);
  const {
    selections,
    isLoading: selectionsLoading,
    isError: selectionsError,
  } = useSelections(sessionId, activeRound);
  const {
    mySelections,
    uid,
    isLoading: mySelectionsLoading,
    isError: mySelectionsError,
  } = useMySelections(sessionId, session?.maxRounds ?? 0);
  const { isHost } = usePlayers(sessionId);

  const isLoading = sessionLoading || roundLoading || selectionsLoading || mySelectionsLoading;
  const isError = sessionError || roundError || selectionsError || mySelectionsError;

  // Auto-advance when all players have submitted their selection.
  // Only the host's client triggers this to avoid duplicate writes.
  const hasAdvancedRef = useRef(false);

  useEffect(() => {
    // Reset the guard when the round changes
    hasAdvancedRef.current = false;
  }, [activeRound]);

  useEffect(() => {
    if (!session || !round || !isHost || !activeRound || hasAdvancedRef.current) return;
    if (round.state !== "open") return;

    const allComplete =
      round.selectionsComplete > 0 && round.selectionsComplete >= session.playerCount;

    if (allComplete) {
      hasAdvancedRef.current = true;
      advanceRound({ sessionId, currentRoundNumber: activeRound });
    }
  }, [
    round?.selectionsComplete,
    round?.state,
    session?.playerCount,
    isHost,
    sessionId,
    activeRound,
  ]);

  const completedUids = new Set(selections.map((s) => s.uid));

  // Navigate to results when the last round (round 1) is closed.
  // Check round.number === 1 to avoid acting on stale data from the
  // previous round that may still be in state during the same render batch.
  useEffect(() => {
    if (!session || !round || !activeRound) return;
    if (activeRound === 1 && round.number === 1 && round.state === "closed") {
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]/results",
        params: { topic, year, sessionId },
      } as never);
    }
  }, [round?.number, round?.state, activeRound, session, sessionId, topic, year]);

  const hasPickedThisRound = activeRound
    ? mySelections.some((s) => s.roundNumber === activeRound)
    : false;

  return {
    isLoading,
    isError,
    session,
    round,
    activeRound,
    completedUids,
    mySelections,
    uid,
    hasPickedThisRound,
  };
}
