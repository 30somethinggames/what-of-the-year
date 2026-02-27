import { FlatList, Text, View } from "react-native";

import type { Player } from "types/session";
import { createStyles } from "utils/theme";

import { Avatar } from "./avatar";
import { Row } from "./row";

interface Props {
  data: Player[];
  completedUids?: Set<string>;
  playerCount: number;
  maxPlayerCount?: number;
}
export function PlayerList({ data, completedUids, playerCount, maxPlayerCount }: Props) {
  const s = useStyles();

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.uid}
      contentContainerStyle={s.root}
      renderItem={({ item }) => {
        const hasCompleted = completedUids?.has(item.uid);
        return (
          <Row>
            <Avatar source={item.avatar} size={40} />
            <Text style={s.playerName}>{item.name}</Text>
            {item.isHost && <Text style={s.hostBadge}>Host</Text>}
            {completedUids && <Text style={s.status}>{hasCompleted ? "✓" : "..."}</Text>}
          </Row>
        );
      }}
      ListFooterComponent={
        <View style={s.footer}>
          <Text style={s.count}>{`${playerCount} of ${maxPlayerCount}`}</Text>
        </View>
      }
    />
  );
}

const useStyles = createStyles((t) => ({
  root: {
    gap: t.spacing.sm,
  },
  playerName: {
    flex: 1,
    fontFamily: t.text.font.medium,
    fontSize: t.text.size.lg,
  },
  hostBadge: {
    fontFamily: t.text.font.semibold,
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
  },
  status: {
    fontSize: t.text.size.lg,
    color: t.colors.black100,
  },
  footer: {
    alignItems: "flex-end",
  },
  count: {
    fontSize: t.text.size.sm,
    color: t.colors.white100,
  },
}));
