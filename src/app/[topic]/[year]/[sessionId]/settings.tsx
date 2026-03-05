import type { ErrorBoundaryProps } from "expo-router";
import { Redirect } from "expo-router";

import { Error } from "components/states/error";
import { useParams } from "hooks/use-params";
import { Settings } from "screens/settings";

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <Error onRetry={retry} />;
}

export default function SettingsModal() {
  const { sessionId, round } = useParams();

  if (!sessionId || !round) {
    return <Redirect href="/" />;
  }

  return <Settings sessionId={sessionId} round={round} />;
}
