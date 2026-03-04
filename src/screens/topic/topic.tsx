import { useAuthActions } from "@convex-dev/auth/react";
import { useHeaderHeight } from "@react-navigation/elements";
import { api } from "convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Avatar, useRandomAvatar } from "components/avatar";
import { Button } from "components/button";
import { Container } from "components/container";
import { Input } from "components/input";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import type { TopicType } from "constants/topics";
import type { SessionID } from "db/types";
import { useTopicData } from "queries/use-topic-data";
import { createStyles } from "utils/theme";

import { MAX_NAME_LENGTH, validateName } from "./utils/validate";

interface Props {
  topic: TopicType;
  year: string;
  existingSessionId?: SessionID;
}

export function Topic({ topic, year, existingSessionId }: Props) {
  const headerHeight = useHeaderHeight();
  const s = useStyles({ headerHeight });
  const { isLoading } = useTopicData({ key: topic.value, year });
  const { isAuthenticated, isLoading: isPending } = useConvexAuth();
  const { signIn } = useAuthActions();
  const mutateJoin = useMutation(api.players.joinSession);
  const mutateCreate = useMutation(api.sessions.createSession);
  const { avatar, randomizeAvatar } = useRandomAvatar();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isAuthenticated && !isPending) signIn("anonymous");
  }, [isAuthenticated, isPending]);

  const nameError = validateName(name);
  const isJoining = !!existingSessionId;
  const disabled = isLoading || isPending || name.length < 1 || nameError != null;
  const label = isPending ? "Loading..." : isJoining ? "Join" : "Create";

  const onSubmit = async () => {
    try {
      let sessionId: string;

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
        sessionId = existingSessionId;
      } else {
        const result = await mutateCreate({
          topic: topic.value,
          year: Number(year),
          name,
          avatar,
        });
        sessionId = result.sessionId;
      }

      router.replace({
        pathname: "/[topic]/[year]/[sessionId]",
        params: { topic: topic.value, year, sessionId, round: "1" },
      });
    } catch (e) {
      // oxlint-disable-next-line no-console
      console.error("Failed to submit:", e);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root}>
      <Container style={s.container}>
        <View style={s.avatar}>
          <Avatar source={avatar} size={120} />
          <Button style={s.btn} label="Random" onPress={randomizeAvatar} />
        </View>
        <View style={s.input}>
          <Input
            placeholder="User name"
            value={name}
            onChangeText={setName}
            error={nameError ?? undefined}
            maxLength={MAX_NAME_LENGTH}
          />
          {nameError ? <Text style={s.error}>{nameError}</Text> : null}
        </View>
        <Button label={label} disabled={disabled} onPress={onSubmit} />
      </Container>
    </KeyboardAvoidingView>
  );
}

const useStyles = createStyles((t, p: { headerHeight: number }) => ({
  root: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing.lg,
    marginTop: -p.headerHeight / 2,
  },
  avatar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: { width: 120 },
  input: { width: "100%", gap: t.spacing.sm },
  error: {
    color: t.colors.red100,
    fontFamily: t.text.font.regular,
    fontSize: t.text.size.sm,
    paddingHorizontal: t.spacing.sm,
  },
}));
