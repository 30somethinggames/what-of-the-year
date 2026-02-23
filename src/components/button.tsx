import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
} from "react-native";

import { createStyles } from "utils/theme";

interface Props extends PressableProps {
  label: string;
}

export function Button({ label, style, disabled, ...props }: Props) {
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={fStyle}
      disabled={disabled}
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
    backgroundColor: "#3292c9",
    // movies 32c992
  },
  text: {
    color: "#f1efea",
    fontSize: t.text.size.xl,
    fontWeight: t.text.weight.bold,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
}));
