import { useState } from "react";
import { FlatList, Text, View } from "react-native";

import { RoundModal } from "./round-modal";
import { useRoundState } from "./use-round-state";
import { Button } from "components/button";
import { Container } from "components/container";
import { Error } from "components/error";
import { Input } from "components/input";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import { Loading } from "components/loading";
// import { MAX_PICK_LENGTH } from "constants/session";
import type { MySelection } from "db/hooks/use-my-selections";
import { saveSelection } from "db/utils/save-selection";
import { createStyles } from "utils/theme";

interface Props {
  sessionId: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Round({ sessionId, isVisible, onClose }: Props) {
  const s = useStyles();
  const {
    isLoading,
    isError,
    session,
    round,
    activeRound,
    completedUids,
    mySelections,
    uid,
    hasPickedThisRound,
  } = useRoundState({ sessionId });

  const [inputValue, setInputValue] = useState("");

  if (isLoading) return <Loading />;
  if (isError || !session || !round || !activeRound) return <Error />;

  const isDisabled = !inputValue.trim() || !uid || hasPickedThisRound;

  const onEnter = async () => {
    if (isDisabled || !uid) return;
    try {
      await saveSelection({ sessionId, roundNumber: activeRound, uid, name: inputValue.trim() });
    } catch {
      // Selection already exists or write failed — ignored since
      // the real-time listener will reflect the current state
    }
    setInputValue("");
  };

  // 2. button next to lock in the pick or edit
  // 3. drag and drop placement
  // 4. move modal to screen
  return (
    <>
      <KeyboardAvoidingView style={s.root}>
        <Container>
          <Text style={s.title}>Round {activeRound}</Text>
          <FlatList
            data={mySelections}
            keyExtractor={(item) => String(item.roundNumber)}
            contentContainerStyle={s.list}
            renderItem={({ item }: { item: MySelection }) => (
              <View style={s.row}>
                <Text style={s.rank}>#{item.roundNumber}</Text>
                <Text style={s.pick}>{item.pick.name}</Text>
              </View>
            )}
          />

          <View style={s.footer}>
            <Input value={inputValue} onChangeText={setInputValue} placeholder="Enter your pick" />
            <Button label="Enter" onPress={onEnter} disabled={isDisabled} />
          </View>
        </Container>
      </KeyboardAvoidingView>
      <RoundModal
        isVisible={isVisible}
        onClose={onClose}
        completedUids={completedUids}
        sessionId={sessionId}
        roundNumber={activeRound}
      />
    </>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
  },
  title: {
    fontSize: t.text.size.xl,
    fontWeight: t.text.weight.bold,
    color: t.colors.primary,
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
    color: t.colors.primary,
  },
  footer: {
    paddingTop: t.spacing.md,
    gap: t.spacing.md,
  },
}));
