import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { RoundModal } from "./round-modal";
import { useRoundState } from "./use-round-state";
import { Autocomplete } from "components/autocomplete";
import { Button } from "components/button";
import { Container } from "components/container";
import { Error } from "components/error";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import { Loading } from "components/loading";
import { Row } from "components/row";
import type { TOPIC_KEY } from "constants/topics";
import type { MySelection } from "db/hooks/use-my-selections";
import { editSelection } from "db/utils/edit-selection";
import { saveSelection } from "db/utils/save-selection";
import { useTopicData } from "queries/use-topic-data";
import type { Option } from "types/option";
import { createStyles } from "utils/theme";

interface Props {
  sessionId: string;
  topic: TOPIC_KEY;
  year: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Round({ sessionId, topic, year, isVisible, onClose }: Props) {
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
  } = useRoundState({ sessionId, topic, year });

  const { data: options = [] } = useTopicData({ key: topic, year });

  const [inputValue, setInputValue] = useState("");
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  if (isLoading) return <Loading />;
  if (isError || !session || !round || !activeRound) return <Error />;

  const isEditing = editingRound !== null;
  const isDisabled = !inputValue.trim() || !uid || (!isEditing && hasPickedThisRound);

  const onEnter = async () => {
    if (isDisabled || !uid) return;
    const name = inputValue.trim();
    const option = selectedOption?.name === name ? selectedOption : undefined;
    try {
      if (isEditing) {
        await editSelection({ sessionId, roundNumber: editingRound, uid, name, option });
        setEditingRound(null);
      } else {
        await saveSelection({ sessionId, roundNumber: activeRound, uid, name, option });
      }
    } catch {
      // Write failed — ignored since the real-time listener will reflect the current state
    }
    setInputValue("");
    setSelectedOption(null);
  };

  const onSelectOption = (option: Option) => {
    setSelectedOption(option);
  };

  const onEdit = (item: MySelection) => {
    setEditingRound(item.roundNumber);
    setInputValue(item.pick.name);
    setSelectedOption(null);
  };

  const onCancelEdit = () => {
    setEditingRound(null);
    setInputValue("");
    setSelectedOption(null);
  };

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
              <Row>
                <Text style={s.rank}>#{item.roundNumber}</Text>
                <Text style={s.pick}>{item.pick.name}</Text>
                <Pressable onPress={() => onEdit(item)} hitSlop={8}>
                  <Text style={s.editButton}>Edit</Text>
                </Pressable>
              </Row>
            )}
          />

          <View style={s.footer}>
            <Autocomplete
              value={inputValue}
              onChangeText={setInputValue}
              onSelectOption={onSelectOption}
              options={options}
              placeholder={isEditing ? "Edit your pick" : "Enter your pick"}
            />
            <Button label={isEditing ? "Save" : "Enter"} onPress={onEnter} disabled={isDisabled} />
            {isEditing && <Button label="Cancel" onPress={onCancelEdit} />}
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
    fontSize: t.text.size.lg,
    fontWeight: t.text.weight.bold,
    color: t.colors.black100,
    paddingVertical: t.spacing.md,
  },
  list: {
    gap: t.spacing.sm,
    flexGrow: 1,
  },
  rank: {
    fontSize: t.text.size.md,
    fontWeight: t.text.weight.bold,
    color: t.colors.black100,
    minWidth: 28,
  },
  pick: {
    flex: 1,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  editButton: {
    fontSize: t.text.size.sm,
    fontWeight: t.text.weight.bold,
    color: t.colors.grey100,
  },
  footer: {
    paddingTop: t.spacing.md,
    gap: t.spacing.md,
  },
}));
