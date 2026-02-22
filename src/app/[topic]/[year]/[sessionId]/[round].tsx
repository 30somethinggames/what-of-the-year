import { Redirect, Stack } from "expo-router";
import { useState } from "react";

import { SettingsButton } from "components/settings-button";
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

  const title = `${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <SettingsButton onPress={onPress} />,
          title,
        }}
      />
      <Round sessionId={sessionId} isVisible={isVisible} onClose={onClose} />
    </>
  );
}
