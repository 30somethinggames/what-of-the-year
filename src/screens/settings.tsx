import { useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";

import { Button } from "components/button";
import { Container } from "components/container";
import { PlayerList } from "components/lists/players";
import { Loading } from "components/states/loading";
import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSelections } from "db/use-selections";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";

interface Props {
  sessionId: SessionID;
  round: number;
}

export function Settings({ sessionId, round }: Props) {
  const navigate = useNavigate();
  const { isLoading: isSessionLoading, session } = useSession(sessionId);
  const { isLoading: isPlayersLoading, players, isHost } = usePlayers(sessionId);
  const { isLoading: isSelectionsLoading, selections } = useSelections(sessionId, round);
  const advanceRound = useMutation(api.rounds.advanceRound);
  const endSession = useMutation(api.sessions.endSession);
  const kickFromGame = useMutation(api.players.kickFromGame);

  useGameOver({ isHost, session });

  if (isSessionLoading || isPlayersLoading || isSelectionsLoading) {
    return <Loading />;
  }

  const completedUids = new Set(selections.map((s) => s.uid));

  const onNextRound = async () => {
    await advanceRound({
      sessionId,
      currentRoundNumber: round,
    });
    window.history.back();
  };

  const onLeaveGame = () => {
    if (isHost) {
      endSession({ sessionId });
    }
    navigate({ to: "/", replace: true });
  };

  const onKick = (uid: string) => {
    if (isHost) {
      kickFromGame({ sessionId, uid });
    }
  };

  return (
    <Container>
      <div className="flex flex-row items-center justify-between py-lg">
        <span data-testid="settings-title" className="font-semibold text-lg text-black-100">
          Settings
        </span>
        <button
          data-testid="close-settings"
          type="button"
          onClick={() => window.history.back()}
          className="text-lg text-grey-100"
        >
          ✕
        </button>
      </div>
      <PlayerList
        data={players}
        completedUids={completedUids}
        maxPlayerCount={session?.maxPlayers}
        onKick={onKick}
      />
      <div className="mt-auto flex flex-col gap-md py-lg">
        {isHost ? (
          <Button
            testID="advance-round"
            label={round > 1 ? "Next Round" : "End Game"}
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
    </Container>
  );
}
