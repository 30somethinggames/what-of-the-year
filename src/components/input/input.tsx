import { TextInput, type TextInputProps, View } from "react-native";

import { createStyles } from "utils/theme";

interface Props extends TextInputProps {
  error?: string;
}
export function Input({ error, style, ...rest }: Props) {
  const s = useStyles();

  return (
    <View style={s.wrapper}>
      <TextInput
        autoCorrect={false}
        autoCapitalize="words"
        placeholderTextColor={s.placeholder.color}
        style={[s.root, error ? s.rootError : undefined, style]}
        {...rest}
      />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrapper: {
    width: "100%",
    gap: t.spacing.sm / 2,
  },
  root: {
    width: "100%",
    backgroundColor: t.colors.white200,
    borderWidth: t.border.size.sm,
    borderColor: t.colors.black100,
    borderRadius: t.border.radius.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    fontFamily: t.text.font.regular,
    fontSize: t.text.size.md,
    color: t.colors.black100,
  },
  rootError: {
    borderColor: t.colors.red100,
  },
  placeholder: {
    color: t.colors.grey100,
  },
}));
