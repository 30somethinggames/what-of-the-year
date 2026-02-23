import { useCallback, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { MAX_NAME_LENGTH, sanitizeName, validateName } from "./sanitize";
import { createStyles } from "utils/theme";

interface Props {
  value: string;
  onChangeText?: ((text: string) => void) | undefined;
  placeholder?: string;
  maxLength?: number;
}
export function Input({ value, onChangeText, placeholder, maxLength = MAX_NAME_LENGTH }: Props) {
  const s = useStyles();
  const [error, setError] = useState("");

  const handleChangeText = useCallback(
    (raw: string) => {
      setError(validateName(raw) ?? "");
      onChangeText?.(sanitizeName(raw));
    },
    [onChangeText],
  );

  return (
    <View style={s.wrapper}>
      <TextInput
        style={[s.root, error ? s.rootError : undefined]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={s.placeholder.color}
        maxLength={maxLength}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
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
    backgroundColor: t.colors.surface,
    borderWidth: t.border.size.sm,
    borderColor: t.colors.primary,
    borderRadius: t.border.radius.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    fontSize: t.text.size.md,
    color: t.colors.primary,
  },
  rootError: {
    borderColor: t.colors.error,
  },
  placeholder: {
    color: t.colors.secondary,
  },
  error: {
    color: t.colors.error,
    fontSize: t.text.size.sm,
    paddingHorizontal: t.spacing.sm,
  },
}));
