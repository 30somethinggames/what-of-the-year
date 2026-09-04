import { createFileRoute } from "@tanstack/react-router";

import { Loading } from "components/states/loading";
import type { SessionID } from "db/types";
import { useSession } from "db/use-sessions";
import { Settings } from "screens/settings";

export const Route = createFileRoute("/$topic/$year/$sessionId/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { sessionId } = Route.useParams();
  const { isLoading, session, activeRound } = useSession(sessionId as SessionID);

  if (isLoading) return <Loading />;
  // A session that resolved to nothing left this on a spinner forever; send it
  // to the boundary instead.
  if (!session || !activeRound) throw new Error("Session not found");

  return <Settings sessionId={sessionId as SessionID} round={activeRound} />;
}
