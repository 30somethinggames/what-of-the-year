import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Share, View } from "react-native";

import type { LobbyProps } from "./types";
import { useLobbyState } from "./use-lobby-state";
import { Button } from "components/button";
import { Container } from "components/container";
import { Error } from "components/error";
import { Loading } from "components/loading";
import { PlayerList } from "components/player-list";
import { MAX_ROUNDS } from "constants/session";
import { leaveSession } from "db/utils/leave-session";
import { startSession } from "db/utils/start-session";
import { createStyles } from "utils/theme";

export function Lobby({ topic, year, sessionId }: LobbyProps) {
  const s = useStyles();
  const {
    isLoading,
    isError,
    session,
    players,
    isHost,
    playerCount,
    maxPlayerCount,
    isDisabled,
    currentUser,
  } = useLobbyState({
    topic,
    year,
    sessionId,
  });

  if (isLoading) return <Loading />;
  if (isError || !session) return <Error />;

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
    await leaveSession({ sessionId, uid: currentUser?.uid });
    router.replace("/");
  };

  return (
    <Container style={s.root}>
      <PlayerList data={players} playerCount={playerCount} maxPlayerCount={maxPlayerCount} />

      <View style={s.footer}>
        {isHost ? (
          <>
            <Button label="Invite" onPress={onShare} />
            <Button label="Start" onPress={onStart} disabled={isDisabled} />
          </>
        ) : (
          <Button label="Leave" onPress={onLeave} />
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
