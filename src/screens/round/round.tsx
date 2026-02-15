import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoundModal } from "./round-modal";
import { useRoundState } from "./use-round-state";
import { Error } from "components/error";
import { Loading } from "components/loading";
import type { TopicType } from "constants/topics";
import { createStyles } from "utils/theme";

interface Props {
  topic: TopicType;
  year: string;
  sessionId: string;
  roundNumber: number;
  isVisible: boolean;
  onClose: () => void;
}

export function Round({ topic, year, sessionId, roundNumber, isVisible, onClose }: Props) {
  const s = useStyles();
  const { isLoading, isError, session, round, completedUids } = useRoundState({
    sessionId,
    roundNumber,
    topic,
    year,
  });

  if (isLoading) return <Loading />;
  if (isError || !session || !round) return <Error />;

  return (
    <>
      <SafeAreaView style={s.root}>
        <Text>Round {roundNumber} - TODO: Implement picking UI</Text>
      </SafeAreaView>

      <RoundModal
        isVisible={isVisible}
        onClose={onClose}
        completedUids={completedUids}
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
