import { Pressable, Text } from "react-native";

import { createStyles } from "utils/theme";

interface Props {
  onPress: () => void;
}
export function SettingsButton({ onPress }: Props) {
  const s = useStyles();
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={s.root}>☰</Text>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    fontSize: t.text.size.lg,
    color: t.colors.black100,
    paddingHorizontal: t.spacing.md,
  },
}));
