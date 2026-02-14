import { Redirect, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { Round } from "screens/round";

import { MAX_ROUNDS } from "db/builders";
import { useParams } from "hooks/use-params";
import { createStyles } from "utils/theme";

export default function RoundIndex() {
  const { topic, year, sessionId, round } = useParams();
  const s = useStyles();
  const [drawerVisible, setDrawerVisible] = useState(false);

  if (!topic || !year || !sessionId || !round) {
    return <Redirect href="/" />;
  }

  const roundNumber = parseInt(round, 10);

  const onClose = () => setDrawerVisible(false);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => setDrawerVisible(true)} hitSlop={8}>
              <Text style={s.menuBtn}>☰</Text>
            </Pressable>
          ),
          title: `Round ${roundNumber} of ${MAX_ROUNDS}`,
        }}
      />
      <Round
        topic={topic}
        year={year}
        sessionId={sessionId}
        roundNumber={roundNumber}
        drawerVisible={drawerVisible}
        onClose={onClose}
      />
    </>
  );
}

const useStyles = createStyles((t) => ({
  menuBtn: {
    fontSize: t.text.size.xxl,
    color: t.text.color.primary,
    paddingHorizontal: t.spacing.md,
  },
}));
