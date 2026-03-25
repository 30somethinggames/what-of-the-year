import { useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";

import { Button } from "components/button";
import { PlayerList } from "components/lists/players";
import { Loading } from "components/states/loading";
import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSelections } from "db/use-selections";
import { useSession } from "db/use-sessions";

interface Props {
  sessionId: SessionID;
  onClose?: () => void;
}

export function Sidebar({ sessionId, onClose }: Props) {
  const navigate = useNavigate();
  const { session, activeRound } = useSession(sessionId);
  const { players, isHost } = usePlayers(sessionId);
  const { selections } = useSelections(sessionId, activeRound);
  const advanceRound = useMutation(api.rounds.advanceRound);
  const endSession = useMutation(api.sessions.endSession);
  const kickFromGame = useMutation(api.players.kickFromGame);

  if (!session) return <Loading />;

  const completedUids = new Set(selections.map((s) => s.uid));

  const onNextRound = async () => {
    if (!activeRound) return;
    await advanceRound({
      sessionId,
      currentRoundNumber: activeRound,
    });
  };

  const onLeaveGame = () => {
    if (isHost) {
      endSession({ sessionId });
    }
    navigate({ to: "/", replace: true });
  };

  const onKick = (uid: string) => {
    kickFromGame({ sessionId, uid });
  };

  return (
    <div className="flex flex-1 flex-col px-md py-md">
      <div className="flex items-center justify-between pb-md">
        <span className="font-semibold text-xl text-black-100">Players</span>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-lg text-grey-100">
            ✕
          </button>
        ) : null}
      </div>
      <PlayerList
        data={players}
        completedUids={completedUids}
        maxPlayerCount={session?.maxPlayers}
        onKick={isHost ? onKick : undefined}
      />
      <div className="mt-auto flex flex-col gap-md pt-lg">
        {isHost && activeRound ? (
          <Button
            testID="advance-round"
            label={activeRound > 1 ? "Next Round" : "End Game"}
            onClick={onNextRound}
          />
        ) : null}
        <Button
          testID="leave-game"
          label="Leave Game"
          onClick={onLeaveGame}
          style={{ backgroundColor: "var(--color-red-100)" }}
        />
      </div>
    </div>
  );
}
