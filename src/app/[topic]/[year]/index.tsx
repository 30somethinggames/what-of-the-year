import { Redirect, Stack } from "expo-router";
import { Topic } from "screens/topic";

import { useParams } from "hooks/use-params";

export default function TopicIndex() {
  const { topic, year, sessionId } = useParams();

  if (!topic || !year) {
    return <Redirect href="/" />;
  }
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
