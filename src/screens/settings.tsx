import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { AppVersion } from "components/app-version";
import { Button } from "components/button";
import { Container } from "components/container";
import { PlayerList } from "components/player-list";
import { Loading } from "components/states/loading";
import type { SessionID } from "db/types";
import { usePlayers } from "db/use-players";
import { useSelections } from "db/use-selections";
import { createStyles } from "utils/theme";

interface Props {
  sessionId: SessionID;
  round: number;
}
export function Settings({ sessionId, round }: Props) {
  const s = useStyles();

  const { isLoading: isPlayersLoading, players, isHost } = usePlayers(sessionId as SessionID);
  const { isLoading: isSelectionsLoading, selections } = useSelections(
    sessionId as SessionID,
    round,
  );
  const advanceRound = useMutation(api.rounds.advanceRound);

  if (isPlayersLoading || isSelectionsLoading) {
    return <Loading />;
  }

  const completedUids = new Set(selections.map((s) => s.uid));

  const onNextRound = async () => {
    await advanceRound({
      sessionId: sessionId as SessionID,
      currentRoundNumber: round,
    });
    router.back();
  };

  const onLeaveGame = () => router.replace("/");

  return (
    <Container>
      <View style={s.header}>
        <Text testID="settings-title" style={s.title}>
          Settings
        </Text>
        <Pressable testID="close-settings" onPress={router.back} hitSlop={8}>
          <Text style={s.closeBtn}>✕</Text>
        </Pressable>
      </View>
      <PlayerList data={players} completedUids={completedUids} maxPlayerCount={10} />
      <View style={s.footer}>
        {isHost && (
          <Button
            testID="advance-round"
            label={round > 1 ? "Next Round" : "End Game"}
            onPress={onNextRound}
          />
        )}
        <Button testID="leave-game" label="Leave Game" onPress={onLeaveGame} style={s.leaveBtn} />
        <AppVersion />
      </View>
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: t.spacing.lg,
    paddingHorizontal: t.spacing.sm,
  },
  title: {
    fontFamily: t.text.font.semibold,
    fontSize: t.text.size.lg,
    color: t.colors.black100,
  },
  closeBtn: {
    fontSize: t.text.size.lg,
    color: t.colors.grey100,
  },
  footer: {
    paddingTop: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.md,
  },
  leaveBtn: {
    backgroundColor: t.colors.red100,
  },
}));
