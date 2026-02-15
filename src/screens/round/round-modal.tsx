import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { PlayerList } from "../../components/player-list";
import { Button } from "components/button";
import { Modal } from "components/modal";
import { advanceRound } from "db/utils/advance-round";
import type { Player } from "types/session";
import { createStyles } from "utils/theme";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  players: Player[];
  completedUids: Set<string>;
  isHost: boolean;
  sessionId: string;
  roundNumber: number;
  maxRounds: number;
}

export function RoundModal({
  isVisible,
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
    <Modal isVisible={isVisible} onClose={onClose}>
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
    </Modal>
  );
}

const useStyles = createStyles((t) => ({
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
