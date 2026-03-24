import { Container } from "components/container";
import { Picks } from "components/lists/picks";
import { Loading } from "components/states/loading";
import type { SessionID } from "db/types";

import { useResultsState } from "./use-results-state";

interface Props {
  sessionId: SessionID;
}

export function Results({ sessionId }: Props) {
  const { isLoading, results } = useResultsState({ sessionId });

  if (isLoading) return <Loading />;

  return (
    <Container>
      <Picks testID="results-list" data={results} />
    </Container>
  );
}
