import { FlatList, Text, View } from "react-native";

import type { RankedPick } from "./use-results-state";
import { useResultsState } from "./use-results-state";
import { Container } from "components/container";
import { Error } from "components/error";
import { Loading } from "components/loading";
import { Row } from "components/row";
import { createStyles } from "utils/theme";

interface Props {
  sessionId: string;
}

export function Results({ sessionId }: Props) {
  const s = useStyles();
  const { isLoading, isError, results } = useResultsState({ sessionId });

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <Container style={s.root}>
      <Text style={s.title}>Results</Text>
      <FlatList
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
  title: {
    fontSize: t.text.size.lg,
    fontWeight: t.text.weight.bold,
    color: t.colors.black100,
    paddingBottom: t.spacing.md,
  },
  list: {
    gap: t.spacing.sm,
    flexGrow: 1,
  },
  rank: {
    fontSize: t.text.size.md,
    fontWeight: t.text.weight.bold,
    color: t.colors.black100,
    minWidth: 28,
  },
  pickInfo: {
    flex: 1,
    gap: 2,
  },
  pickName: {
    fontSize: t.text.size.md,
    fontWeight: t.text.weight.semibold,
    color: t.colors.black100,
  },
  voters: {
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
  },
  totalPoints: {
    fontSize: t.text.size.md,
    fontWeight: t.text.weight.bold,
    color: t.colors.black100,
  },
}));
