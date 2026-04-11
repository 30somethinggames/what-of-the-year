import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar, useRandomAvatar } from "components/avatar";
import { Button } from "components/button";
import { Container } from "components/container";
import { Input } from "components/input";
import type { TopicType } from "constants/topics";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { MAX_NAME_LENGTH, validateName } from "convex/utils/validate";
import type { SessionID } from "db/types";
import { useTopicData } from "queries/use-topic-data";

interface Props {
  topic: TopicType;
  year: string;
  existingSessionId?: SessionID;
}

export function Topic({ topic, year, existingSessionId }: Props) {
  const navigate = useNavigate();
  const { isLoading } = useTopicData({ key: topic.value, year });
  const mutateJoin = useMutation(api.players.joinSession);
  const mutateCreate = useMutation(api.sessions.createSession);
  const { avatar, randomizeAvatar } = useRandomAvatar();
  const [name, setName] = useState("");

  const nameError = validateName(name);
  const isJoining = !!existingSessionId;
  const disabled = isLoading || name.length < 1 || nameError != null;
  const label = isJoining ? "Join" : "Create";

  const onSubmit = async () => {
    try {
      if (isJoining) {
        try {
          await mutateJoin({
            sessionId: existingSessionId,
            name,
            avatar,
          });
        } catch (e: unknown) {
          const error = e as Error;
          if (error.message !== "Already joined this session") throw e;
        }
      } else {
        const result = await mutateCreate({
          topic: topic.value,
          year: Number(year),
          name,
          avatar,
        });
        navigate({
          to: "/$topic/$year/$sessionId",
          params: { topic: topic.value, year, sessionId: result.sessionId },
          replace: true,
        });
      }
    } catch (e) {
      // oxlint-disable-next-line no-console
      console.error("Failed to submit:", e);
    }
  };

  return (
    <Container className="items-center justify-center gap-lg">
      <div className="flex w-full flex-row items-center justify-between">
        <Avatar source={avatar} size={120} />
        <Button
          testID="random-avatar"
          label="Random"
          onClick={randomizeAvatar}
          style={{ width: 120 }}
        />
      </div>
      <div className="flex w-full flex-col gap-sm">
        <Input
          testID="name-input"
          placeholder="User name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError ?? undefined}
          maxLength={MAX_NAME_LENGTH}
        />
        {nameError ? <span className="text-sm text-red-100 px-sm">{nameError}</span> : null}
      </div>
      <Button testID="setup-submit" label={label} disabled={disabled} onClick={onSubmit} />
    </Container>
  );
}
