import { type ErrorBoundaryProps, Redirect, Stack } from "expo-router";

import { Header } from "components/header";
import { Error } from "components/states/error";
import { useParams } from "hooks/use-params";
import { Lobby } from "screens/lobby";

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <Error onRetry={retry} />;
}

export default function LobbyIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year || !sessionId) {
    return <Redirect href="/" />;
  }

  const title = `Lobby ${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen options={{ headerTitle: () => <Header title={title} /> }} />
      <Lobby topic={topic} year={year} sessionId={sessionId} />
    </>
  );
}
