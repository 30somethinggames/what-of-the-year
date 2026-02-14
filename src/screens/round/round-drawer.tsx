import { router } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";

import { PlayerList } from "../../components/player-list";
import { Button } from "components/button";
import { advanceRound } from "db/advance-round";
import type { PlayerWithId } from "db/use-players";
import { createStyles } from "utils/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  players: PlayerWithId[];
  completedUids: Set<string>;
  isHost: boolean;
  sessionId: string;
  roundNumber: number;
  maxRounds: number;
}

export function RoundDrawer({
  visible,
  onClose,
  players,
  completedUids,
  isHost,
  sessionId,
  roundNumber,
  maxRounds,
}: Props) {
  const s = useStyles();

  const onNextRound = async () => {
    await advanceRound({
      sessionId,
      currentRoundNumber: roundNumber,
      maxRounds,
    });

    // Navigation will be handled by the useEffect in the round screen
    // that watches session.activeRoundNumber
    onClose();
  };

  const onLeaveGame = () => {
    router.replace("/");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.drawer} onStartShouldSetResponder={() => true}>
          <View style={s.header}>
            <Text style={s.title}>
              Round {roundNumber} of {maxRounds}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={s.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <PlayerList
            data={players}
            completedUids={completedUids}
            playerCount={players.length}
            maxPlayerCount={10}
          />

          <View style={s.footer}>
            {isHost && (
              <Button
                label={roundNumber < maxRounds ? "Next Round" : "End Game"}
                onPress={onNextRound}
                style={s.nextBtn}
              />
            )}
            <Button label="Leave Game" onPress={onLeaveGame} style={s.leaveBtn} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const useStyles = createStyles((t) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: t.colors.background,
    borderTopLeftRadius: t.border.radius.lg * 2,
    borderTopRightRadius: t.border.radius.lg * 2,
    maxHeight: "80%",
    paddingBottom: t.spacing.lg * 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: t.spacing.lg,
  },
  title: {
    fontSize: t.text.size.xl,
    fontWeight: t.text.weight.bold,
    color: t.text.color.primary,
  },
  closeBtn: {
    fontSize: t.text.size.xxl,
    color: t.text.color.secondary,
  },
  footer: {
    paddingTop: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.md,
  },
  nextBtn: {
    backgroundColor: t.colors.primary,
  },
  leaveBtn: {
    backgroundColor: t.colors.error,
  },
}));
