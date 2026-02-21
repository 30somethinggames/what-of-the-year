import { FlatList, Text, View } from "react-native";

import { Avatar } from "./avatar/avatar";
import type { Player } from "types/session";
import { createStyles } from "utils/theme";

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
          <View style={s.row}>
            <Avatar source={item.avatar} size={40} />
            <Text style={s.playerName}>{item.name}</Text>
            {item.isHost && <Text style={s.hostBadge}>Host</Text>}
            {completedUids && <Text style={s.status}>{hasCompleted ? "✓" : "..."}</Text>}
          </View>
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
    paddingHorizontal: t.spacing.md,
    gap: t.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.surface,
    padding: t.spacing.sm,
    borderRadius: t.border.radius.lg,
    gap: t.spacing.md,
  },
  playerName: {
    flex: 1,
    fontSize: t.text.size.lg,
    fontWeight: t.text.weight.medium,
  },
  hostBadge: {
    fontSize: t.text.size.sm,
    fontWeight: t.text.weight.semibold,
    color: t.colors.primary,
  },
  status: {
    fontSize: t.text.size.xl,
    color: t.colors.primary,
  },
  footer: {
    alignItems: "flex-end",
  },
  count: {
    fontSize: t.text.size.sm,
    color: t.colors.background,
  },
}));
