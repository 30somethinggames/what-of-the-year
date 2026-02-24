import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { PlayerList } from "../../components/player-list";
import { Button } from "components/button";
import { Loading } from "components/loading";
import { Modal } from "components/modal";
import { usePlayers } from "db/hooks/use-players";
import { advanceRound } from "db/utils/advance-round";
import { createStyles } from "utils/theme";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  completedUids: Set<string>;
  sessionId: string;
  roundNumber: number;
}

export function RoundModal({ isVisible, onClose, completedUids, sessionId, roundNumber }: Props) {
  const s = useStyles();
  const { players, isHost, isLoading, isError } = usePlayers(sessionId);

  const onNextRound = async () => {
    await advanceRound({
      sessionId,
      currentRoundNumber: roundNumber,
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
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <View style={s.header}>
            <Text style={s.title}>Round {roundNumber}</Text>
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
                label={roundNumber > 1 ? "Next Round" : "End Game"}
                onPress={onNextRound}
                style={s.nextBtn}
              />
            )}
            <Button label="Leave Game" onPress={onLeaveGame} style={s.leaveBtn} />
          </View>
        </>
      )}
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
    fontSize: t.text.size.lg,
    fontWeight: t.text.weight.bold,
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
  nextBtn: {
    backgroundColor: t.colors.black100,
  },
  leaveBtn: {
    backgroundColor: t.colors.red100,
  },
}));
