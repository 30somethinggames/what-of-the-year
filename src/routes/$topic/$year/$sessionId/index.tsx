import { createFileRoute } from "@tanstack/react-router";

import { type TOPIC_KEY, getTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Lobby } from "screens/lobby";

export const Route = createFileRoute("/$topic/$year/$sessionId/")({
  component: LobbyRoute,
});

function LobbyRoute() {
  const { topic: topicKey, year, sessionId } = Route.useParams();
  const topic = getTopic(topicKey as TOPIC_KEY);

  if (!topic) return null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-center py-md">
        <span className="font-semibold text-lg">{`Lobby ${topic.label} of ${year}`}</span>
      </div>
      <Lobby topic={topic} year={year} sessionId={sessionId as SessionID} />
    </div>
  );
}
