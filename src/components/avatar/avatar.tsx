import { Image } from "expo-image";
import { View } from "react-native";

import { createStyles } from "utils/theme";

interface Props {
  source: string;
  size?: number;
}

export function Avatar({ source, size = 100 }: Props) {
  const s = useStyles();
  return (
    <View style={[s.root, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image style={s.image} source={{ uri: source }} contentFit="cover" transition={200} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    overflow: "hidden",
    backgroundColor: t.colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
}));
