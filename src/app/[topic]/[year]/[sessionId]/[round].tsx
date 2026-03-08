import type { ErrorBoundaryProps } from "expo-router";
import { Link, Redirect, Stack } from "expo-router";

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

  if (!topic || !year || !sessionId || !round) {
    return <Redirect href="/" />;
  }

  const title = `${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Link
              href={{
                pathname: "/[topic]/[year]/[sessionId]/settings",
                params: { topic: topic.value, year, sessionId, round },
              }}
              asChild
            >
              <SettingsButton onPress={() => {}} />
            </Link>
          ),
          headerTitle: () => <Header title={title} />,
        }}
      />
      <Round sessionId={sessionId} topic={topic.value} year={year} />
    </>
  );
}
