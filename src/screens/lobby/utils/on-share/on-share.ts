import type { TopicType } from "constants/topics";

type Args = {
  topic: TopicType;
  year: string;
  sessionId: string;
};

export const onShare = async ({ topic, year, sessionId }: Args) => {
  const url = `${window.location.origin}/${topic.value}/${year}/${sessionId}`;
  await navigator.clipboard.writeText(url);
};
