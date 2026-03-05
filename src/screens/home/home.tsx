import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { AppVersion } from "components/app-version";
import { Button } from "components/button";
import { Container } from "components/container";
import { Picker } from "components/picker";
import { type TopicType, topics } from "constants/topics";
import { type Year, years } from "constants/years";
import { createStyles, themes } from "utils/theme";

import { useHomeAnimation } from "./use-home-animation";

export function Home() {
  const [topic, setTopic] = useState<TopicType>(topics[0]);
  const [year, setYear] = useState<Year>(years[0]);
  const s = useStyles({ backgroundColor: themes[topic.value].topic.color });
  const { topicStyle, yearStyle, ofStyle, btnStyle } = useHomeAnimation();

  return (
    <Animated.View style={s.root}>
      <Container>
        <View style={s.content}>
          <Animated.View style={[s.pickerWrapper, topicStyle]}>
            <Picker testID="topic-picker" data={topics} value={topic} onValueChange={setTopic} />
          </Animated.View>

          <Animated.Text style={[s.of, ofStyle]}>of</Animated.Text>

          <Animated.View style={[s.pickerWrapper, yearStyle]}>
            <Picker testID="year-picker" data={years} value={year} onValueChange={setYear} />
          </Animated.View>
        </View>

        <Animated.View style={[btnStyle, s.footer]}>
          <Link
            asChild
            href={{ pathname: "/[topic]/[year]", params: { topic: topic.value, year: year.value } }}
          >
            <Button label="Start" style={s.btn} />
          </Link>
          <AppVersion />
        </Animated.View>
      </Container>
    </Animated.View>
  );
}

const useStyles = createStyles((t, p: { backgroundColor: string }) => ({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerWrapper: { width: "100%" },
  of: {
    fontFamily: t.text.font.semibold,
    fontSize: 52,
    color: t.colors.black100,
    marginVertical: t.spacing.lg,
  },
  footer: { gap: t.spacing.md },
  btn: { backgroundColor: p.backgroundColor },
}));
