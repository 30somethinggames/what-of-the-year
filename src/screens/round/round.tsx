import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoundModal } from "./round-modal";
import { useRoundState } from "./use-round-state";
import { Error } from "components/error";
import { Loading } from "components/loading";
import { TopicType } from "constants/topics";
import { createStyles } from "utils/theme";

interface Props {
  topic: TopicType;
  year: string;
  sessionId: string;
  roundNumber: number;
  drawerVisible: boolean;
  onClose: () => void;
}

// TODO move usePlayers to PlayerList
export function Round({ topic, year, sessionId, roundNumber, drawerVisible, onClose }: Props) {
  const s = useStyles();
  const { isLoading, error, session, round, players, completedUids, isHost } = useRoundState({
    sessionId,
    roundNumber,
    topic,
    year,
  });

  if (isLoading) return <Loading />;
  if (error || !session || !round || !roundNumber) return <Error />;

  return (
    <>
      <SafeAreaView style={s.root}>
        <Text>Round {roundNumber} - TODO: Implement picking UI</Text>
      </SafeAreaView>

      <RoundModal
        visible={drawerVisible}
        onClose={onClose}
        players={players}
        completedUids={completedUids}
        isHost={isHost}
        sessionId={sessionId}
        roundNumber={roundNumber}
        maxRounds={session.maxRounds}
      />
    </>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    backgroundColor: t.colors.background,
    paddingHorizontal: t.spacing.lg,
  },
}));
