import { Image } from "expo-image";
import { View } from "react-native";

import { createStyles } from "utils/theme";

interface Props {
  source: string;
  size?: number;
}

export function Avatar({ source, size = 100 }: Props) {
  const s = useStyles({ size });
  return (
    <View style={s.root}>
      <Image style={s.image} source={{ uri: source }} contentFit="cover" transition={200} />
    </View>
  );
}

const useStyles = createStyles((t, p: { size: number }) => ({
  root: {
    overflow: "hidden",
    width: p.size,
    height: p.size,
    borderRadius: p.size / 2,
    borderWidth: t.border.size.sm,
    borderColor: t.colors.black100,
    backgroundColor: t.colors.white200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
}));
