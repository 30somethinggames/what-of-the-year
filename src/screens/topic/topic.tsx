import { useHeaderHeight } from "@react-navigation/elements";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Avatar, useRandomAvatar } from "components/avatar";
import { Button } from "components/button";
import { Error } from "components/error";
import { Input } from "components/input";
import { KeyboardAvoidingView } from "components/keyboard-avoiding-view";
import { TopicType } from "constants/topics";
import { createSession } from "db/create-session";
import { joinSession } from "db/join-session";
import { useAuth } from "db/use-auth";
import { useTopicData } from "queries/use-topic-data";
import { createStyles } from "utils/theme";

interface Props {
  topic: TopicType;
  year: string;
  existingSessionId?: string;
}
export function Topic({ topic, year, existingSessionId }: Props) {
  const s = useStyles();
  const headerHeight = useHeaderHeight();
  const { isLoading, isError, refetch } = useTopicData({ key: topic.value, year: year! });
  const { avatar, randomizeAvatar } = useRandomAvatar();
  const [name, setName] = useState("");
  const { mutateAsync: signIn, isPending } = useAuth();

  const isJoining = !!existingSessionId;
  const disabled = isLoading || isPending || name.length < 1;
  const label = isPending ? "Loading..." : isJoining ? "Join" : "Create";

  const onChangeText = (text: string) => setName(text);

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
    <KeyboardAvoidingView style={s.root} keyboardVerticalOffset={headerHeight}>
      <View style={[s.container, { marginTop: -headerHeight / 2 }]}>
        <View style={s.avatar}>
          <Avatar source={avatar} size={120} />
          <Button style={s.btn} label="Random" onPress={randomizeAvatar} />
        </View>
        <Input placeholder="User name" value={name} onChangeText={onChangeText} />
        <Button label={label} disabled={disabled} onPress={onSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: t.colors.background,
    paddingHorizontal: t.spacing.md,
  },
  container: {
    alignItems: "center",
    gap: t.spacing.lg,
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
}));
