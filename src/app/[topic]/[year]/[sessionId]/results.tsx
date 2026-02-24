import { Redirect, Stack } from "expo-router";

import { Header } from "components/header";
import { useParams } from "hooks/use-params";
import { Results } from "screens/results";

export default function ResultsIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year || !sessionId) {
    return <Redirect href="/" />;
  }

  const title = `${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen options={{ headerTitle: () => <Header title={title} /> }} />
      <Results sessionId={sessionId} />
    </>
  );
}
