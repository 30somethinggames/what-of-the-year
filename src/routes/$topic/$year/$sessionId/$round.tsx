import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
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
      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black-100/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-white-100 shadow-lg"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <Sidebar
                sessionId={sessionId as SessionID}
                topic={topicKey}
                year={year}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex items-baseline justify-between px-md py-md">
        <SettingsButton onClick={() => setSidebarOpen(true)} />
        <Header title={`${topic.label} of ${year} - Round ${round}`} />
        <div className="w-10" />
      </div>
      <Round sessionId={sessionId as SessionID} topic={topic.value} year={year} />
    </>
  );
}
