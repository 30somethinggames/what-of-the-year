import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "components/button";
import { Container } from "components/container";
import { Picker } from "components/picker";
import type { TopicType } from "constants/topics";
import { topics } from "constants/topics";
import type { Year } from "constants/years";
import { years } from "constants/years";
import { createStyles, useTheme } from "utils/theme";

export function Home() {
  const [topic, setTopic] = useState<TopicType>(topics[0]);
  const [year, setYear] = useState<Year>(years[0]);
  const { setTheme } = useTheme();
  const s = useStyles();

  const onTopicChange = (v: TopicType) => {
    setTopic(v);
    setTheme(v.value);
  };

  const onYearChange = (v: Year) => setYear(v);

  return (
    <Container>
      <View style={s.root}>
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
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  of: {
    fontSize: 52,
    fontWeight: t.text.weight.bold,
    color: t.colors.primary,
    marginVertical: t.spacing.lg,
  },
}));
