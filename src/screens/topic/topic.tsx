import { useHeaderHeight } from "@react-navigation/elements";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { Avatar, useRandomAvatar } from "components/avatar";
import { Button } from "components/button";
import { Container } from "components/container";
import { Error } from "components/error";
import { Input } from "components/input";
import { MAX_NAME_LENGTH, validateName } from "components/input/sanitize";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import type { TopicType } from "constants/topics";
import { useAuth } from "db/hooks/use-auth";
import { createSession } from "db/utils/create-session";
import { joinSession } from "db/utils/join-session";
import { useTopicData } from "queries/use-topic-data";
import { createStyles } from "utils/theme";

interface Props {
  topic: TopicType;
  year: string;
  existingSessionId?: string;
}
export function Topic({ topic, year, existingSessionId }: Props) {
  const headerHeight = useHeaderHeight();
  const s = useStyles({ headerHeight });
  const { isLoading, isError, refetch } = useTopicData({ key: topic.value, year });
  const { avatar, randomizeAvatar } = useRandomAvatar();
  const { mutateAsync: signIn, isPending } = useAuth();
  const [name, setName] = useState("");

  const nameError = validateName(name);
  const isJoining = !!existingSessionId;
  const disabled = isLoading || isPending || name.length < 1 || nameError != null;
  const label = isPending ? "Loading..." : isJoining ? "Join" : "Create";

  const onSubmit = async () => {
    try {
      const user = await signIn();

      let sessionId: string;

      if (isJoining && existingSessionId) {
        try {
          await joinSession({
            sessionId: existingSessionId,
            uid: user.uid,
            name,
            avatar,
          });
        } catch (e: unknown) {
          const error = e as Error;
          if (error.message !== "Already joined this session") throw e;
        }
        sessionId = existingSessionId;
      } else {
        const result = await createSession({
          topic: topic.value,
          year: Number(year),
          uid: user.uid,
          name,
          avatar,
        });
        sessionId = result.sessionId;
      }

      /**
       * Use router.replace instead of router.push to prevent users from navigating
       * back to the topic/join screen after entering a session. Once a user has
       * joined or created a session, they should not be able to return to this
       * screen using the back button, as it would create a confusing UX and
       * potentially allow duplicate session creation.
       */
      router.replace({
        pathname: "/[topic]/[year]/[sessionId]",
        params: { topic: topic.value, year, sessionId, round: "1" },
      });
    } catch (e) {
      // oxlint-disable-next-line no-console
      console.error("Failed to submit:", e);
    }
  };

  if (isError) return <Error onRetry={refetch} />;

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
  root: {
    flex: 1,
  },
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
  btn: {
    width: 120,
  },
  input: {
    width: "100%",
    gap: t.spacing.sm,
  },
  error: {
    color: t.colors.red100,
    fontSize: t.text.size.sm,
    paddingHorizontal: t.spacing.sm,
  },
}));
