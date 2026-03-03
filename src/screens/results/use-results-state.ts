import { useAllSelections } from "db/hooks/use-all-selections";
import { usePlayers } from "db/hooks/use-players";
import { useSession } from "db/hooks/use-sessions";
import type { SessionID } from "db/types";
import type { Pick } from "types/session";

interface Props {
  sessionId: SessionID;
}

export interface PickVote {
  playerName: string;
  playerAvatar: string;
  points: number;
}

export interface RankedPick {
  pick: Pick;
  totalPoints: number;
  votes: PickVote[];
}

export function useResultsState({ sessionId }: Props) {
  const { session, isLoading: sessionLoading } = useSession(sessionId);
  const { players, isLoading: playersLoading } = usePlayers(sessionId);
  const {
    allSelections,
    isLoading: selectionsLoading,
    isError: selectionsError,
  } = useAllSelections(sessionId, session?.maxRounds ?? 0);

  const isLoading = sessionLoading || playersLoading || selectionsLoading;
  const isError = selectionsError;

  // Build a lookup for player info
  const playerMap = new Map(players.map((p) => [p.uid, p]));

  // Accumulate points per pick (keyed by pick id) across all players
  const pickMap = new Map<string, RankedPick>();
  for (const sel of allSelections) {
    const key = sel.pick.id;
    const existing = pickMap.get(key);
    const player = playerMap.get(sel.uid);
    const vote: PickVote = {
      playerName: player?.name ?? "Unknown",
      playerAvatar: player?.avatar ?? "",
      points: sel.points,
    };

    if (existing) {
      existing.totalPoints += sel.points;
      existing.votes.push(vote);
    } else {
      pickMap.set(key, {
        pick: sel.pick,
        totalPoints: sel.points,
        votes: [vote],
      });
    }
  }

  // Sort picks by total accumulated points descending
  const results: RankedPick[] = Array.from(pickMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  return { isLoading, isError, session, results };
}
