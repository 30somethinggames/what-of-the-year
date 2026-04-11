import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { SettingsButton } from "components/settings-button";
import { Sidebar } from "components/sidebar";
import { type TOPIC_KEY, getTopic } from "constants/topics";
import type { SessionID } from "db/types";
import { Results } from "screens/results";

export const Route = createFileRoute("/$topic/$year/$sessionId/results")({
  component: ResultsRoute,
});

function ResultsRoute() {
  const { topic: topicKey, year, sessionId } = Route.useParams();
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
        <span className="font-semibold text-lg">{`${topic.label} of ${year}`}</span>
        <div className="w-10" />
      </div>
      <Results sessionId={sessionId as SessionID} />
    </>
  );
}
