import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "components/header";
import { SettingsButton } from "components/settings-button";
import { Sidebar } from "components/sidebar";
import { type TOPIC_KEY, requireTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Results } from "screens/results";

export const Route = createFileRoute("/$topic/$year/$sessionId/results")({
  component: ResultsRoute,
});

function ResultsRoute() {
  const { topic: topicKey, year, sessionId } = Route.useParams();
  const topic = requireTopic(topicKey as TOPIC_KEY);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        sessionId={sessionId as SessionID}
        topic={topicKey}
        year={year}
        handleClose={() => setSidebarOpen(false)}
      />

      <div className="flex items-baseline justify-between px-md py-md">
        <SettingsButton onClick={() => setSidebarOpen(true)} />
        <Header title={`${topic.label} of ${year}`} />
        <div className="w-10" />
      </div>
      <Results sessionId={sessionId as SessionID} />
    </>
  );
}
