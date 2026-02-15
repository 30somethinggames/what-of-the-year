import { Redirect, Stack } from "expo-router";

import { useParams } from "hooks/use-params";
import { Lobby } from "screens/lobby";

export default function LobbyIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year || !sessionId) {
    return <Redirect href="/" />;
  }

  const title = `Lobby ${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <Lobby topic={topic} year={year} sessionId={sessionId} />
    </>
  );
}
