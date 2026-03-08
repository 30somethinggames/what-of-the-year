import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { FlatList, Text, View } from "react-native";

import { Container } from "components/container";
import { Row } from "components/row";
import { Loading } from "components/states/loading";
import type { SessionID } from "db/types";
import { createStyles } from "utils/theme";

import { useResultsState } from "./use-results-state";

type RankedPick = FunctionReturnType<typeof api.selections.getResults>[number];

interface Props {
  sessionId: SessionID;
}

export function Results({ sessionId }: Props) {
  const s = useStyles();
  const { isLoading, results } = useResultsState({ sessionId });

  if (isLoading) return <Loading />;

  return (
    <Container style={s.root}>
      <FlatList
        testID="results-list"
        data={results}
        keyExtractor={(item) => item.pick.id}
        contentContainerStyle={s.list}
        renderItem={({ item, index }: { item: RankedPick; index: number }) => (
          <Row>
            <Text style={s.rank}>#{index + 1}</Text>
            <View style={s.pickInfo}>
              <Text style={s.pickName}>{item.pick.name}</Text>
              <Text style={s.voters}>{item.votes.map((v) => `${v.playerName}`).join(", ")}</Text>
            </View>
            <Text style={s.totalPoints}>{item.totalPoints}pts</Text>
          </Row>
        )}
      />
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
  },
  list: {
    gap: t.spacing.sm,
    flexGrow: 1,
  },
  rank: {
    fontFamily: t.text.font.bold,
    fontSize: t.text.size.md,
    color: t.colors.black100,
    minWidth: 28,
  },
  pickInfo: {
    flex: 1,
    gap: 2,
  },
  pickName: {
    fontFamily: t.text.font.semibold,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  voters: {
    fontFamily: t.text.font.regular,
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
  },
  totalPoints: {
    fontFamily: t.text.font.bold,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
}));
