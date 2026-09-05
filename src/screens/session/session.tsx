import { DisplayError } from "components/states/error";
import { Loading } from "components/states/loading";
import { SessionStatus } from "convex/constants";
import { Lobby } from "screens/lobby";
import { Results } from "screens/results";
import { Round } from "screens/round";

import { GameHeader } from "./game-header";
import type { SessionProps } from "./types";
import { useSessionState } from "./utils/use-session-state";

/**
 * The one screen behind `/$topic/$year/$sessionId`. The server's session
 * status decides what renders — lobby, the round in play, or results — so no
 * client ever navigates between phases, and a refresh or invite link lands on
 * the right one.
 */
export function Session({ topic, year, sessionId }: SessionProps) {
  const { isLoading, session } = useSessionState({ sessionId });

  if (isLoading) return <Loading />;
  if (!session) return <DisplayError />;

  if (session.status === SessionStatus.LOBBY) {
    return (
      <>
        <div className="flex items-center justify-center py-md">
          <span className="font-semibold text-lg">{`Lobby ${topic.label} of ${year}`}</span>
        </div>
        <Lobby topic={topic} year={year} sessionId={sessionId} />
      </>
    );
  }

  const isActive = session.status === SessionStatus.ACTIVE;
  const title = isActive
    ? `${topic.label} of ${year} - Round ${session.activeRoundNumber}`
    : `${topic.label} of ${year}`;

  return (
    <>
      <GameHeader title={title} sessionId={sessionId} />
      {isActive ? (
        <Round sessionId={sessionId} topic={topic.value} year={year} />
      ) : (
        <Results sessionId={sessionId} />
      )}
    </>
  );
}
