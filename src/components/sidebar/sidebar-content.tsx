import * as Sentry from "@sentry/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "components/button";
import { PlayerList } from "components/lists/players";
import { Loading } from "components/states/loading";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSelections } from "db/use-selections";
import { useSession } from "db/use-sessions";

export interface SidebarContentProps {
  sessionId: SessionID;
  topic: string;
  year: string;
  handleClose?: () => void;
}

export function SidebarContent({ sessionId, topic, year, handleClose }: SidebarContentProps) {
  const navigate = useNavigate();
  const { session, activeRound } = useSession(sessionId);
  const { players, isHost } = usePlayers(sessionId);
  const { selections } = useSelections(sessionId, activeRound);
  const advanceRound = useMutation(api.rounds.advanceRound);
  const endSession = useMutation(api.sessions.endSession);
  const leaveSession = useMutation(api.players.leaveSession);
  const kickFromGame = useMutation(api.players.kickFromGame);

  if (!session) return <Loading />;

  const completedUids = new Set(selections.map((s) => s.uid));

  const onNextRound = async () => {
    if (!activeRound) return;
    try {
      const { hasNextRound } = await advanceRound({
        sessionId,
        currentRoundNumber: activeRound,
      });
      if (!hasNextRound) {
        navigate({
          to: "/$topic/$year/$sessionId/results",
          params: { topic, year, sessionId },
          replace: true,
        });
      }
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  const onLeaveGame = async () => {
    try {
      if (isHost) {
        await endSession({ sessionId });
      } else {
        await leaveSession({ sessionId });
      }
    } catch (e) {
      Sentry.captureException(e);
    }
    navigate({ to: "/", replace: true });
  };

  const onKick = (uid: string) => {
    if (isHost) {
      kickFromGame({ sessionId, uid }).catch(Sentry.captureException);
    }
  };

  return (
    <div className="flex flex-1 flex-col px-md py-md">
      <div className="flex items-center justify-between pb-md">
        <span data-testid="sidebar-title" className="font-semibold text-xl text-black-100">
          Players
        </span>
        {handleClose ? (
          <button
            data-testid="close-sidebar"
            type="button"
            onClick={handleClose}
            className="text-lg text-grey-100"
          >
            ✕
          </button>
        ) : null}
      </div>
      <PlayerList
        data={players}
        completedUids={completedUids}
        maxPlayerCount={session?.maxPlayers}
        onKick={onKick}
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
          className="bg-red-100"
        />
      </div>
    </div>
  );
}
