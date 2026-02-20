import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

import { useParams } from "hooks/use-params";
import { Topic } from "screens/topic";
import { useTheme } from "utils/theme";

export default function TopicIndex() {
  const { topic, year, sessionId } = useParams();
  const { themeName, setTheme } = useTheme();

  // set theme for invited user
  // get strict
  useEffect(() => {
    if (topic && topic.value !== themeName) {
      setTheme(topic.value);
    }
  }, []);

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
