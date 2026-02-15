import { Redirect, Stack } from "expo-router";
import { useState } from "react";

import { SettingsButton } from "components/settings-button";
import { MAX_ROUNDS } from "constants/session";
import { useParams } from "hooks/use-params";
import { Round } from "screens/round";

export default function RoundIndex() {
  const { topic, year, sessionId, round } = useParams();
  const [isVisible, setIsVisible] = useState(false);

  if (!topic || !year || !sessionId || !round) {
    return <Redirect href="/" />;
  }

  const onPress = () => setIsVisible(true);
  const onClose = () => setIsVisible(false);

  const roundNumber = parseInt(round, 10);
  const title = `Round ${roundNumber} of ${MAX_ROUNDS}`;

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <SettingsButton onPress={onPress} />,
          title,
        }}
      />
      <Round
        topic={topic}
        year={year}
        sessionId={sessionId}
        roundNumber={roundNumber}
        isVisible={isVisible}
        onClose={onClose}
      />
    </>
  );
}
