import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "components/button";
import { Picker } from "components/picker";
import { TopicType, topics } from "constants/topics";
import { Year, years } from "constants/years";
import { createStyles, useTheme } from "utils/theme";

export default function Index() {
  const [topic, setTopic] = useState<TopicType>(topics[0]);
  const [year, setYear] = useState<Year>(years[0]);
  const { setTheme } = useTheme();
  const s = useStyles();

  const onTopicChange = (v: TopicType) => {
    setTopic(v);
    setTheme(v.value);
  };

  const onYearChange = (v: Year) => {
    setYear(v);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.content}>
        <Picker testID="topic-picker" data={topics} value={topic} onValueChange={onTopicChange} />
        <Text style={s.of}>of</Text>
        <Picker testID="year-picker" data={years} value={year} onValueChange={onYearChange} />
      </View>

      <Link
        asChild
        href={{
          pathname: "/[topic]/[year]",
          params: { topic: topic.value, year: year.value },
        }}
      >
        <Button label="Start" />
      </Link>
    </SafeAreaView>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    backgroundColor: t.colors.background,
    padding: t.spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  of: {
    fontSize: 52,
    fontWeight: t.text.weight.bold,
    color: t.text.color.primary,
    marginVertical: t.spacing.lg,
  },
}));
