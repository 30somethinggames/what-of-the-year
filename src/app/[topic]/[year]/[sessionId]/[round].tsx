import type { ErrorBoundaryProps } from "expo-router";
import { Redirect, Stack } from "expo-router";
import { useState } from "react";

import { Header } from "components/header";
import { SettingsButton } from "components/settings-button";
import { Error } from "components/states/error";
import type { SessionID } from "db/types";
import { useParams } from "hooks/use-params";
import { Round } from "screens/round";

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <Error onRetry={retry} />;
}

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
          headerTitle: () => <Header title={title} />,
        }}
      />
      <Round
        sessionId={sessionId as SessionID}
        topic={topic.value}
        year={year}
        isVisible={isVisible}
        onClose={onClose}
      />
    </>
  );
}
