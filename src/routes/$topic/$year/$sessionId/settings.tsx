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
  const { isLoading, activeRound } = useSession(sessionId as SessionID);

  if (isLoading || !activeRound) {
    return <Loading />;
  }

  return <Settings sessionId={sessionId as SessionID} round={activeRound} />;
}
