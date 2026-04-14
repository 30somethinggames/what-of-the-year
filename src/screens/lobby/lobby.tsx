import * as Sentry from "@sentry/react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "components/button";
import { Container } from "components/container";
import { PlayerList } from "components/lists/players";
import { DisplayError } from "components/states/error";
import { Loading } from "components/states/loading";
import { useToast } from "components/toast/use-toast";
import { api } from "convex/_generated/api";
import { MAX_ROUNDS } from "convex/constants";
import { useMutation } from "convex/react";

import { Topic } from "../topic";
import type { LobbyProps } from "./types";
import { useLobbyState } from "./utils/use-lobby-state";

export function Lobby({ topic, year, sessionId }: LobbyProps) {
  const navigate = useNavigate();
  const { isLoading, session, players, currentUser, isHost, maxPlayerCount } = useLobbyState({
    topic,
    year,
    sessionId,
  });

  const toast = useToast();
  const leaveSession = useMutation(api.players.leaveSession);
  const kickFromLobby = useMutation(api.players.kickFromLobby);
  const startSession = useMutation(api.sessions.startSession);

  if (isLoading) return <Loading />;
  if (!session) return <DisplayError />;

  if (!currentUser) {
    return <Topic topic={topic} year={year} existingSessionId={sessionId} />;
  }

  const onStart = async () => {
    try {
      await startSession({ sessionId });
      navigate({
        to: "/$topic/$year/$sessionId/$round",
        params: {
          topic: topic.value,
          year,
          sessionId,
          round: String(MAX_ROUNDS),
        },
        replace: true,
      });
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  const onLeave = async () => {
    try {
      await leaveSession({ sessionId });
      navigate({ to: "/", replace: true });
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  const handleOnShare = async () => {
    const url = `${window.location.origin}/${topic.value}/${year}/${sessionId}`;
    await navigator.clipboard.writeText(url);
    toast.show({ message: "Invite link copied!", variant: "success" });
  };

  const onKick = (uid: string) => {
    if (isHost) kickFromLobby({ sessionId, uid });
  };

  return (
    <Container>
      <div data-testid="session-id" data-value={sessionId} className="hidden" />
      <PlayerList data={players} maxPlayerCount={maxPlayerCount} onKick={onKick} />

      <div className="mt-auto flex flex-col gap-md">
        {isHost ? (
          <>
            <Button testID="invite" label="Invite" onClick={handleOnShare} />
            <Button testID="lobby-start" label="Start" onClick={onStart} />
          </>
        ) : (
          <Button testID="leave-lobby" label="Leave" onClick={onLeave} />
        )}
      </div>
    </Container>
  );
}
