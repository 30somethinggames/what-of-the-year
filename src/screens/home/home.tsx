import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "components/button";
import { Container } from "components/container";
import { Picker } from "components/picker";
import { type TopicType, topics } from "constants/topics";
import { type Year, years } from "constants/years";
import { createStyles, themes } from "utils/theme";

export function Home() {
  const [topic, setTopic] = useState<TopicType>(topics[0]);
  const [year, setYear] = useState<Year>(years[0]);
  const s = useStyles({ backgroundColor: themes[topic.value].topic.color });

  const onTopicChange = (v: TopicType) => setTopic(v);
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
        <Button label="Start" style={s.btn} />
      </Link>
    </Container>
  );
}

const useStyles = createStyles((t, p: { backgroundColor: string }) => ({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  of: {
    fontFamily: t.text.font.semibold,
    fontSize: 52,
    color: t.colors.black100,
    marginVertical: t.spacing.lg,
  },
  btn: {
    backgroundColor: p.backgroundColor,
  },
}));
