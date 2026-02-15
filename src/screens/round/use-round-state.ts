import { router } from "expo-router";
import { useEffect } from "react";

import type { TopicType } from "constants/topics";
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
  const { session, isLoading: sessionLoading, isError: sessionError } = useSession(sessionId);
  const { round, isLoading: roundLoading, isError: roundError } = useRound(sessionId, roundNumber);
  const {
    selections,
    isLoading: selectionsLoading,
    isError: selectionsError,
  } = useSelections(sessionId, roundNumber);

  const isLoading = sessionLoading || roundLoading || selectionsLoading;
  const isError = sessionError || roundError || selectionsError;

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

  return { isLoading, isError, session, round, completedUids };
}
