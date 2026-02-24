import { Text } from "react-native";

import { createStyles } from "utils/theme";

interface Props {
  title: string;
}
export function Header({ title }: Props) {
  const s = useStyles();

  return <Text style={s.root}>{title}</Text>;
}

const useStyles = createStyles((t) => ({
  root: {
    fontWeight: t.text.weight.bold,
    fontSize: t.text.size.lg,
    backgroundColor: t.colors.transparent,
  },
}));
