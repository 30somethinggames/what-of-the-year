import { Redirect, Stack } from "expo-router";

import { Header } from "components/header";
import { useParams } from "hooks/use-params";
import { Topic } from "screens/topic";

export default function TopicIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year) return <Redirect href="/" />;

  const title = `${topic.label} of ${year}`;

  return (
    <>
      <Stack.Screen options={{ headerTitle: () => <Header title={title} /> }} />
      <Topic topic={topic} year={year} existingSessionId={sessionId} />
    </>
  );
}
