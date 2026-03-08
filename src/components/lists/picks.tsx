import { Image } from "expo-image";
import { FlatList, Pressable, Text, View } from "react-native";

import type { MySelection, RankedPick } from "db/types";
import { createStyles } from "utils/theme";

import { Row } from "./components/row";

type PickItem = MySelection | RankedPick;

function isRankedPick(item: PickItem): item is RankedPick {
  return "totalPoints" in item;
}

interface BaseDisplayProps {
  rank: number;
  uri?: string;
}
function BaseDisplay({ rank, uri }: BaseDisplayProps) {
  const s = useStyles();
  return (
    <>
      <Text style={s.rank}>#{rank}</Text>
      {uri ? <Image source={{ uri }} style={s.cover} /> : null}
    </>
  );
}

function RankedRow({ item, rank }: { item: RankedPick; rank: number }) {
  const s = useStyles();
  return (
    <Row>
      <BaseDisplay rank={rank} uri={item.pick.cover} />
      <View style={s.pickInfo}>
        <Text style={s.pickName}>{item.pick.name}</Text>
        <Text style={s.voters}>{item.votes.map((v) => v.playerName).join(", ")}</Text>
      </View>
      <Text style={s.totalPoints}>{item.totalPoints}pts</Text>
    </Row>
  );
}

function SelectionRow({
  item,
  onEdit,
}: {
  item: MySelection;
  onEdit?: (item: MySelection) => void;
}) {
  const s = useStyles();
  return (
    <Row>
      <BaseDisplay rank={item.roundNumber} uri={item.pick.cover} />
      <Text style={s.pick}>{item.pick.name}</Text>
      {onEdit ? (
        <Pressable onPress={() => onEdit(item)} hitSlop={8}>
          <Text style={s.editButton}>Edit</Text>
        </Pressable>
      ) : null}
    </Row>
  );
}

interface Props {
  data: PickItem[];
  testID?: string;
  onEdit?: (item: MySelection) => void;
}
export function Picks({ data, testID, onEdit }: Props) {
  const s = useStyles();
  return (
    <FlatList<PickItem>
      testID={testID}
      data={data}
      keyExtractor={(item) => item.pick.id}
      contentContainerStyle={s.list}
      renderItem={({ item, index }) =>
        isRankedPick(item) ? (
          <RankedRow item={item} rank={index + 1} />
        ) : (
          <SelectionRow item={item} onEdit={onEdit} />
        )
      }
    />
  );
}

const useStyles = createStyles((t) => ({
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
  pick: {
    flex: 1,
    fontFamily: t.text.font.regular,
    fontSize: t.text.size.md,
    color: t.colors.black100,
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
  cover: {
    width: 40,
    height: 56,
    borderRadius: t.border.radius.sm,
    borderWidth: t.border.size.sm,
    borderColor: t.border.color,
    backgroundColor: "transparent",
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
  editButton: {
    fontFamily: t.text.font.bold,
    fontSize: t.text.size.sm,
    color: t.colors.grey100,
  },
}));
