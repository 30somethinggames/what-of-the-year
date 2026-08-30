import * as Sentry from "@sentry/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Autocomplete } from "components/autocomplete";
import { Button } from "components/button";
import { Container } from "components/container";
import { Picks } from "components/lists/picks";
import { DisplayError } from "components/states/error";
import { Loading } from "components/states/loading";
import { useToast } from "components/toast/use-toast";
import type { TOPIC_KEY } from "constants/topics";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import type { SessionID } from "db/types";
import { useTopicData } from "queries/use-topic-data";
import type { Option } from "types/option";
import { getApiError } from "utils/api-error";
import { tryCatch } from "utils/try-catch";

import { Reveal } from "./reveal";
import { useAvailableOptions } from "./utils/use-available-options";
import { useRoundState } from "./utils/use-round-state";

interface Props {
  sessionId: SessionID;
  topic: TOPIC_KEY;
  year: string;
}

export function Round({ sessionId, topic, year }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    isLoading,
    session,
    round,
    mySelections,
    hasPickedThisRound,
    isRevealing,
    selections,
    players,
    isHost,
  } = useRoundState({
    sessionId,
    topic,
    year,
  });

  const saveSelection = useMutation(api.selections.saveSelection);
  const editSelection = useMutation(api.selections.editSelection);
  const advanceRound = useMutation(api.rounds.advanceRound);

  const { data: options = [] } = useTopicData({ key: topic, year });

  const [inputValue, setInputValue] = useState("");
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const availableOptions = useAvailableOptions(options, mySelections, editingRound);

  if (isLoading) return <Loading />;
  if (!session) return <DisplayError />;

  if (isRevealing) {
    const onSkip = async () => {
      const { data, error } = await tryCatch(
        advanceRound({ sessionId, currentRoundNumber: session.activeRoundNumber }),
      );
      if (error) {
        Sentry.captureException(error);
        toast.show({ message: getApiError(error).message, variant: "error" });
        return;
      }
      if (!data.hasNextRound) {
        navigate({
          to: "/$topic/$year/$sessionId/results",
          params: { topic, year: String(year), sessionId },
          replace: true,
        });
      }
    };

    return (
      <Reveal
        selections={selections}
        players={players}
        revealEndsAt={round?.revealEndsAt ?? undefined}
        isHost={isHost}
        onSkip={onSkip}
      />
    );
  }

  const isEditing = editingRound !== null;
  const isDisabled = !selectedOption || (!isEditing && hasPickedThisRound);

  const onEnter = async () => {
    if (isDisabled || !selectedOption) return;
    if (isEditing) {
      const { error } = await tryCatch(
        editSelection({ sessionId, roundNumber: editingRound, option: selectedOption }),
      );
      if (error) {
        Sentry.captureException(error);
        toast.show({ message: getApiError(error).message, variant: "error" });
        return;
      }
      setEditingRound(null);
    } else {
      const { error } = await tryCatch(
        saveSelection({
          sessionId,
          roundNumber: session.activeRoundNumber,
          option: selectedOption,
        }),
      );
      if (error) {
        Sentry.captureException(error);
        toast.show({ message: getApiError(error).message, variant: "error" });
        return;
      }
    }
    setInputValue("");
    setSelectedOption(null);
  };

  const onSelectOption = (option: Option) => setSelectedOption(option);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setSelectedOption(null);
  };

  const onEdit = (item: (typeof mySelections)[number]) => {
    setEditingRound(item.roundNumber);
    setInputValue(item.pick.name);
    setSelectedOption({
      id: Number(item.pick.id),
      name: item.pick.name,
      cover: item.pick.cover,
      rating: item.pick.rating ?? 0,
      first_release_date: item.pick.first_release_date ?? 0,
      summary: item.pick.summary,
    });
  };

  const onCancelEdit = () => {
    setEditingRound(null);
    setInputValue("");
    setSelectedOption(null);
  };

  return (
    <Container>
      <Picks testID="round-list" data={mySelections} onEdit={onEdit} />
      <div className="mt-auto flex flex-col gap-md pt-md">
        <Autocomplete
          testID="pick-input"
          value={inputValue}
          onChangeText={handleInputChange}
          onSelectOption={onSelectOption}
          options={availableOptions}
          placeholder={isEditing ? "Edit your pick" : "Enter your pick"}
        />
        <Button
          testID="submit-pick"
          label={isEditing ? "Save" : "Enter"}
          onClick={onEnter}
          disabled={isDisabled}
        />
        {isEditing ? <Button testID="cancel-edit" label="Cancel" onClick={onCancelEdit} /> : null}
      </div>
    </Container>
  );
}
