import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { Autocomplete } from "components/autocomplete";
import { Button } from "components/button";
import { Container } from "components/container";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import { Row } from "components/row";
import { Error } from "components/states/error";
import { Loading } from "components/states/loading";
import type { TOPIC_KEY } from "constants/topics";
import type { SessionID } from "db/types";
import { useTopicData } from "hooks/queries/use-topic-data";
import type { Option } from "types/option";
import { createStyles } from "utils/theme";

import { RoundModal } from "./round-modal";
import { useAvailableOptions } from "./utils/use-available-options";
import { useRoundState } from "./utils/use-round-state";

interface Props {
  sessionId: SessionID;
  topic: TOPIC_KEY;
  year: string;
  isVisible: boolean;
  onClose: () => void;
}

export function Round({ sessionId, topic, year, isVisible, onClose }: Props) {
  const s = useStyles();
  const {
    isLoading,
    session,
    round,
    activeRound,
    completedUids,
    mySelections,
    hasPickedThisRound,
  } = useRoundState({ sessionId, topic, year });

  const saveSelection = useMutation(api.selections.saveSelection);
  const editSelection = useMutation(api.selections.editSelection);

  const { data: options = [] } = useTopicData({ key: topic, year });

  console.log("data: ", options);

  const [inputValue, setInputValue] = useState("");
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const availableOptions = useAvailableOptions(options, mySelections, editingRound);

  if (isLoading) return <Loading />;
  if (!session || !round || !activeRound) return <Error />;

  const isEditing = editingRound !== null;
  const isDisabled = !inputValue.trim() || (!isEditing && hasPickedThisRound);

  const onEnter = async () => {
    if (isDisabled) return;
    const name = inputValue.trim();
    const option = selectedOption?.name === name ? selectedOption : undefined;
    try {
      if (isEditing) {
        await editSelection({ sessionId, roundNumber: editingRound, name, option });
        setEditingRound(null);
      } else {
        await saveSelection({ sessionId, roundNumber: activeRound, name, option });
      }
    } catch {
      // Write failed — real-time listener will reflect current state
    }
    setInputValue("");
    setSelectedOption(null);
  };

  const onSelectOption = (option: Option) => setSelectedOption(option);

  const onEdit = (item: (typeof mySelections)[number]) => {
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
            renderItem={({ item }) => (
              <Row>
                <Text style={s.rank}>#{item.roundNumber}</Text>
                {item.pick.cover ? (
                  <Image source={{ uri: item.pick.cover }} style={s.cover} />
                ) : null}
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
              options={availableOptions}
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
  root: { flex: 1 },
  title: {
    fontFamily: t.text.font.semibold,
    fontSize: t.text.size.lg,
    color: t.colors.black100,
    paddingVertical: t.spacing.md,
  },
  list: { gap: t.spacing.sm, flexGrow: 1 },
  rank: {
    fontFamily: t.text.font.bold,
    fontSize: t.text.size.md,
    color: t.colors.black100,
    minWidth: 28,
  },
  pick: {
    flex: 1,
    fontFamily: t.text.font.regular,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  cover: {
    width: 40,
    height: 56,
    borderRadius: t.border.radius.sm,
    borderWidth: t.border.size.sm,
    borderColor: t.border.color,
    backgroundColor: "transparent",
  },
  editButton: {
    fontFamily: t.text.font.bold,
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
  },
  footer: {
    paddingTop: t.spacing.md,
    gap: t.spacing.md,
  },
}));
