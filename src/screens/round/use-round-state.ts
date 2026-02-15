import { router } from "expo-router";
import { useEffect } from "react";

import type { TopicType } from "constants/topics";
import { usePlayers } from "db/hooks/use-players";
import { useRound } from "db/hooks/use-round";
import { useSelections } from "db/hooks/use-selections";
import { useSession } from "db/hooks/use-session";

interface Props {
  sessionId: string;
  roundNumber: number;
  topic: TopicType;
  year: string;
}
export function useRoundState({ sessionId, roundNumber, topic, year }: Props) {
  const { session, isLoading: sessionLoading, error: sessionError } = useSession(sessionId);
  const { round, isLoading: roundLoading, error: roundError } = useRound(sessionId, roundNumber);
  const { players, isHost, isLoading: playersLoading, error: playersError } = usePlayers(sessionId);
  const {
    selections,
    isLoading: selectionsLoading,
    error: selectionsError,
  } = useSelections(sessionId, roundNumber);

  const isLoading = sessionLoading || roundLoading || playersLoading || selectionsLoading;
  const error = sessionError || roundError || playersError || selectionsError;

  // Sync URL with session.activeRoundNumber
  useEffect(() => {
    if (session && roundNumber && session.activeRoundNumber !== roundNumber) {
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]/[round]",
        params: {
          topic: topic.value,
          year,
          sessionId,
          round: String(session.activeRoundNumber),
        },
      });
    }
  }, [session?.activeRoundNumber, roundNumber, topic.value, year, sessionId]);

  const completedUids = new Set(selections.map((s) => s.uid));

  return { isLoading, error, session, round, completedUids, players, isHost };
}
