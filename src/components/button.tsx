import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
} from "react-native";

import { haptics } from "utils/haptics";
import { createStyles } from "utils/theme";

interface Props extends PressableProps {
  label: string;
}

export function Button({ label, style, disabled, onPress, ...props }: Props) {
  const s = useStyles();
  const fStyle = (state: PressableStateCallbackType) => {
    const resolvedStyle = typeof style === "function" ? style(state) : style;
    return StyleSheet.flatten([
      s.root,
      resolvedStyle,
      !disabled && state.pressed && s.pressed,
      disabled && s.disabled,
    ]);
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
    haptics.light();
    onPress?.(e);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={fStyle}
      disabled={disabled}
      onPress={handlePress}
      {...props}
    >
      <Text style={s.text}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    width: "100%",
    alignItems: "center",
    borderRadius: t.border.radius.lg,
    paddingVertical: t.spacing.md,
    backgroundColor: t.topic.color,
  },
  text: {
    ...t.text.shadow,
    color: t.colors.white200,
    fontFamily: t.text.font.semibold,
    fontSize: t.text.size.xl,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
}));
