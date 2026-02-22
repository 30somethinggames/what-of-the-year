import type { PressableProps, PressableStateCallbackType } from "react-native";
import { Pressable, Text } from "react-native";

import { flatten } from "utils/styles";
import { createStyles } from "utils/theme";

interface Props extends PressableProps {
  label: string;
}

export function Button({ label, style, disabled, ...props }: Props) {
  const s = useStyles();
  const fStyle = (state: PressableStateCallbackType) => {
    const resolvedStyle = typeof style === "function" ? style(state) : style;
    return flatten([
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
    borderWidth: t.border.size.lg,
    borderColor: t.colors.primary,
    borderRadius: t.border.radius.lg,
    paddingVertical: t.spacing.md,
    backgroundColor: t.colors.yellow100,
  },
  text: {
    ...t.shadow.text,
    color: t.colors.white100,
    fontSize: t.text.size.xl,
    fontWeight: t.text.weight.bold,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
}));
