import { Pressable, Text } from "react-native";

import { createStyles } from "utils/theme";

interface Props {
  onPress: () => void;
}
export function SettingsButton({ onPress }: Props) {
  const s = useStyles();
  return (
    <Pressable testID="settings-button" onPress={onPress} hitSlop={8}>
      <Text style={s.root}>☰</Text>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    fontSize: 28,
    color: t.colors.black100,
    paddingHorizontal: t.spacing.sm,
  },
}));
