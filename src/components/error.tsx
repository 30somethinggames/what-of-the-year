import { Text, View } from "react-native";

import { Avatar } from "./avatar/avatar";
import { Button } from "./button";
import { createStyles } from "utils/theme";

const SAD_ROBOT = "https://api.dicebear.com/7.x/bottts/svg?seed=sad";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function Error({ message = "Something went wrong", onRetry }: Props) {
  const s = useStyles();
  return (
    <View style={s.root}>
      <Avatar source={SAD_ROBOT} size={80} />
      <View style={s.content}>
        <Text style={s.message}>{message}</Text>
        {onRetry && <Button label="Retry" onPress={onRetry} />}
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.lg,
  },
  content: {
    flexShrink: 1,
    gap: t.spacing.md,
  },
  message: {
    color: t.colors.primary,
    fontSize: t.text.size.lg,
    fontWeight: t.text.weight.medium,
  },
}));
