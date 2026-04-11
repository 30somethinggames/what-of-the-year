import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "components/header";
import { SettingsButton } from "components/settings-button";
import { Sidebar } from "components/sidebar";
import { type TOPIC_KEY, getTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Round } from "screens/round";

export const Route = createFileRoute("/$topic/$year/$sessionId/$round")({
  component: RoundRoute,
});

function RoundRoute() {
  const { topic: topicKey, year, sessionId, round } = Route.useParams();
  const topic = getTopic(topicKey as TOPIC_KEY);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!topic) return null;

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
        <Header title={`${topic.label} of ${year} - Round ${round}`} />
        <div className="w-10" />
      </div>
      <Round sessionId={sessionId as SessionID} topic={topic.value} year={year} />
    </>
  );
}
