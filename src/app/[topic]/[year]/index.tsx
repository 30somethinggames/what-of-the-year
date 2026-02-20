import { Redirect, Stack } from "expo-router";

import { useParams } from "hooks/use-params";
import { Topic } from "screens/topic";

export default function TopicIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year) return <Redirect href="/" />;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${topic.label} of ${year}`,
        }}
      />
      <Topic topic={topic} year={year} existingSessionId={sessionId} />
    </>
  );
}
