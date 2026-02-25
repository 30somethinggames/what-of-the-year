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
    fontFamily: t.text.font.semibold,
    fontSize: t.text.size.lg,
    backgroundColor: "transparent",
  },
}));
