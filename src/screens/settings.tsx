import * as Sentry from "@sentry/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "components/button";
import { Container } from "components/container";
import { PlayerList } from "components/lists/players";
import { Loading } from "components/states/loading";
import { useToast } from "components/toast/use-toast";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSelections } from "db/use-selections";
import { useSession } from "db/use-sessions";
import { useGameOver } from "hooks/use-game-over";
import { getApiError } from "utils/api-error";
import { tryCatch } from "utils/try-catch";

interface Props {
  sessionId: SessionID;
  round: number;
}

export function Settings({ sessionId, round }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
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
    const { error } = await tryCatch(advanceRound({ sessionId, currentRoundNumber: round }));
    if (error) {
      Sentry.captureException(error);
      toast.show({ message: getApiError(error).message, variant: "error" });
      return;
    }
    window.history.back();
  };

  const onLeaveGame = async () => {
    if (isHost) {
      const { error } = await tryCatch(endSession({ sessionId }));
      if (error) {
        // Leave the room regardless — the host is done here either way.
        Sentry.captureException(error);
        toast.show({ message: getApiError(error).message, variant: "error" });
      }
    }
    navigate({ to: "/", replace: true });
  };

  const onKick = async (uid: string) => {
    if (!isHost) return;
    const { error } = await tryCatch(kickFromGame({ sessionId, uid }));
    if (error) {
      Sentry.captureException(error);
      toast.show({ message: getApiError(error).message, variant: "error" });
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
