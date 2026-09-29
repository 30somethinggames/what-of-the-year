import { createFileRoute } from "@tanstack/react-router";

import { type TOPIC_KEY, requireTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Session } from "screens/session";

export const Route = createFileRoute("/$topic/$year/$sessionId/")({
  component: SessionRoute,
});

function SessionRoute() {
  const { topic: topicKey, year, sessionId } = Route.useParams();
  const topic = requireTopic(topicKey as TOPIC_KEY);

  return <Session topic={topic} year={year} sessionId={sessionId as SessionID} />;
}
