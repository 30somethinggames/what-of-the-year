import type { ErrorBoundaryProps } from "expo-router";
import { Redirect } from "expo-router";

import { Error } from "components/states/error";
import { Loading } from "components/states/loading";
import { useSession } from "db/use-sessions";
import { useParams } from "hooks/use-params";
import { Settings } from "screens/settings";

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <Error onRetry={retry} />;
}

export default function SettingsModal() {
  const { sessionId } = useParams();
  const { isLoading, activeRound } = useSession(sessionId);

  if (!sessionId) {
    return <Redirect href="/" />;
  }

  if (isLoading || !activeRound) {
    return <Loading />;
  }

  return <Settings sessionId={sessionId} round={activeRound} />;
}
