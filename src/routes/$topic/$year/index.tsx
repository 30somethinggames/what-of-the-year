import { createFileRoute } from "@tanstack/react-router";

import { type TOPIC_KEY, requireTopic } from "constants/topics";
import { Topic } from "screens/topic";

export const Route = createFileRoute("/$topic/$year/")({
  component: TopicRoute,
});

function TopicRoute() {
  const { topic: topicKey, year } = Route.useParams();
  const topic = requireTopic(topicKey as TOPIC_KEY);

  return (
    <>
      <div className="flex items-center justify-center py-md">
        <span className="font-semibold text-lg">{`${topic.label} of ${year}`}</span>
      </div>
      <Topic topic={topic} year={year} />
    </>
  );
}
