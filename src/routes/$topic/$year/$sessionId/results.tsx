import { createFileRoute } from "@tanstack/react-router";

import { type TOPIC_KEY, getTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Results } from "screens/results";

export const Route = createFileRoute("/$topic/$year/$sessionId/results")({
  component: ResultsRoute,
});

function ResultsRoute() {
  const { topic: topicKey, year, sessionId } = Route.useParams();
  const topic = getTopic(topicKey as TOPIC_KEY);

  if (!topic) return null;

  return (
    <>
      <div className="flex items-center justify-center py-md">
        <span className="font-semibold text-lg">{`${topic.label} of ${year}`}</span>
      </div>
      <Results sessionId={sessionId as SessionID} />
    </>
  );
}
