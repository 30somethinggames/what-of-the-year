import { api } from "convex/_generated/api";
import { MAX_ROUNDS } from "convex/constants";
import { useMutation } from "convex/react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Share, View } from "react-native";

import { Button } from "components/button";
import { Container } from "components/container";
import { PlayerList } from "components/lists/players";
import { Error } from "components/states/error";
import { Loading } from "components/states/loading";
import { TestLabel } from "components/test-label";
import { createStyles } from "utils/theme";

import type { LobbyProps } from "./types";
import { useLobbyState } from "./use-lobby-state";

export function Lobby({ topic, year, sessionId }: LobbyProps) {
  const s = useStyles();
  const { isLoading, session, players, isHost, maxPlayerCount } = useLobbyState({
    topic,
    year,
    sessionId,
  });

  const leaveSession = useMutation(api.players.leaveSession);
  const kickFromLobby = useMutation(api.players.kickFromLobby);
  const startSession = useMutation(api.sessions.startSession);

  if (isLoading) return <Loading />;
  // TODO figure out
  if (!session) return <Error />;

  const onShare = async () => {
    const url = Linking.createURL(`/${topic.value}/${year}`, {
      queryParams: { sessionId },
    });

    await Share.share({
      message: `Join my ${topic.label} of ${year}!\n${url}`,
    });
  };

  const onStart = async () => {
    await startSession({ sessionId });
    router.replace({
      pathname: "/[topic]/[year]/[sessionId]/[round]",
      params: { topic: topic.value, year, sessionId, round: String(MAX_ROUNDS) },
    });
  };

  const onLeave = async () => {
    await leaveSession({ sessionId });
    router.replace("/");
  };

  return (
    <Container style={s.root}>
      <TestLabel testID="session-id" value={sessionId} />
      <PlayerList
        data={players}
        maxPlayerCount={maxPlayerCount}
        onKick={isHost ? (uid) => kickFromLobby({ sessionId, uid }) : undefined}
      />

      <View style={s.footer}>
        {isHost ? (
          <>
            <Button testID="invite" label="Invite" onPress={onShare} />
            <Button testID="lobby-start" label="Start" onPress={onStart} />
          </>
        ) : (
          <Button testID="leave-lobby" label="Leave" onPress={onLeave} />
        )}
      </View>
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
  },
  footer: {
    gap: t.spacing.md,
  },
}));
