import { Link, createFileRoute } from "@tanstack/react-router";

import { Header } from "components/header";
import { SettingsButton } from "components/settings-button";
import { type TOPIC_KEY, getTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Round } from "screens/round";

export const Route = createFileRoute("/$topic/$year/$sessionId/$round")({
  component: RoundRoute,
});

function RoundRoute() {
  const { topic: topicKey, year, sessionId } = Route.useParams();
  const topic = getTopic(topicKey as TOPIC_KEY);

  if (!topic) return null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-md py-md">
        <Link to="/$topic/$year/$sessionId/settings" params={{ topic: topicKey, year, sessionId }}>
          <SettingsButton />
        </Link>
        <Header title={`${topic.label} of ${year}`} />
        <div className="w-10" />
      </div>
      <Round sessionId={sessionId as SessionID} topic={topic.value} year={year} />
    </div>
  );
}
