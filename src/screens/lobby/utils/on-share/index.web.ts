import type { TopicType } from "constants/topics";

type Args = {
  topic: TopicType;
  year: string;
  sessionId: string;
};

export const onShare = async ({ topic, year, sessionId }: Args) => {
  const url = new URL(`/${topic.value}/${year}`, window.location.origin);
  url.searchParams.set("sessionId", sessionId);

  await navigator.clipboard.writeText(url.toString());
};
