import type { ErrorBoundaryProps } from "expo-router";
import { Redirect, Stack } from "expo-router";

import { Header } from "components/header";
import { Error } from "components/states/error";
import type { SessionID } from "db/types";
import { useParams } from "hooks/use-params";
import { Results } from "screens/results";

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <Error onRetry={retry} />;
}

export default function ResultsIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year || !sessionId) {
    return <Redirect href="/" />;
  }

  const title = `${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <Header title={title} />,
          headerBackTitle: "Done",
          gestureEnabled: false,
        }}
      />
      <Results sessionId={sessionId as SessionID} />
    </>
  );
}
