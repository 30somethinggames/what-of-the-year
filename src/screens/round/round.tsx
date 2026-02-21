import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoundModal } from "./round-modal";
import { useRoundState } from "./use-round-state";
import { Button } from "components/button";
import { Error } from "components/error";
import { Input } from "components/input";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import { Loading } from "components/loading";
import { MAX_PICK_LENGTH } from "constants/session";
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

  const [inputValue, setInputValue] = useState("");
  const [picks, setPicks] = useState<string[]>([]);

  if (isLoading) return <Loading />;
  if (isError || !session || !round) return <Error />;

  const onEnter = () => {
    if (!inputValue.trim()) return;
    setPicks((prev) => [...prev, inputValue.trim()]);
    setInputValue("");
  };

  return (
    <>
      <SafeAreaView style={s.root}>
        <Text style={s.title}>Round {roundNumber}</Text>

        <FlatList
          data={picks}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={s.list}
          renderItem={({ item, index }) => (
            <View style={s.row}>
              <Text style={s.rank}>#{index + 1}</Text>
              <Text style={s.pick}>{item}</Text>
            </View>
          )}
        />

        <KeyboardAvoidingView>
          <View style={s.footer}>
            <Input
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter your pick"
              maxLength={MAX_PICK_LENGTH}
            />
            <Button label="Enter" onPress={onEnter} disabled={!inputValue.trim()} />
          </View>
        </KeyboardAvoidingView>
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
  title: {
    fontSize: t.text.size.xl,
    fontWeight: t.text.weight.bold,
    color: t.text.color.primary,
    paddingVertical: t.spacing.md,
  },
  list: {
    gap: t.spacing.sm,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.surface,
    padding: t.spacing.sm,
    borderRadius: t.border.radius.lg,
    gap: t.spacing.md,
  },
  rank: {
    fontSize: t.text.size.md,
    fontWeight: t.text.weight.bold,
    color: t.colors.primary,
    minWidth: 28,
  },
  pick: {
    flex: 1,
    fontSize: t.text.size.md,
    color: t.text.color.primary,
  },
  footer: {
    paddingVertical: t.spacing.md,
    gap: t.spacing.md,
  },
}));
