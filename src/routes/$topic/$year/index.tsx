import { createFileRoute } from "@tanstack/react-router";

import { type TOPIC_KEY, getTopic } from "constants/topics";
import { Topic } from "screens/topic";

export const Route = createFileRoute("/$topic/$year/")({
  component: TopicRoute,
});

function TopicRoute() {
  const { topic: topicKey, year } = Route.useParams();
  const topic = getTopic(topicKey as TOPIC_KEY);

  if (!topic) return null;

  return (
    <div className="flex h-full w-full max-w-140 flex-col overflow-x-hidden bg-white-100 shadow-md">
      <div className="flex items-center justify-center py-md">
        <span className="font-semibold text-lg">{`${topic.label} of ${year}`}</span>
      </div>
      <Topic topic={topic} year={year} />
    </div>
  );
}
