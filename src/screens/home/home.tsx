import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";

import { Button } from "components/button";
import { Container } from "components/container";
import { Picker } from "components/picker";
import { type TopicType, topics } from "constants/topics";
import { type Year, years } from "constants/years";

const spring = { type: "spring" as const, damping: 20, stiffness: 300, mass: 0.8 };

export function Home() {
  const [topic, setTopic] = useState<TopicType>(topics[0]);
  const [year, setYear] = useState<Year>(years[0]);

  return (
    <Container className="justify-between" data-topic={topic.value}>
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          className="w-full"
          initial={{ x: "-100vw" }}
          animate={{ x: 0 }}
          transition={{ ...spring, delay: 0.5 }}
        >
          <Picker testID="topic-picker" data={topics} value={topic} onValueChange={setTopic} />
        </motion.div>

        <motion.span
          className="my-lg font-semibold text-[52px] text-black-100"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 300 }}
        >
          of
        </motion.span>

        <motion.div
          className="w-full"
          initial={{ x: "100vw" }}
          animate={{ x: 0 }}
          transition={{ ...spring, delay: 0.65 }}
        >
          <Picker testID="year-picker" data={years} value={year} onValueChange={setYear} />
        </motion.div>
      </div>

      <motion.div
        className="flex flex-col gap-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 120, delay: 0.95 }}
      >
        <Link to="/$topic/$year" params={{ topic: topic.value, year: String(year.value) }}>
          <Button testID="home-start" label="Start" />
        </Link>
      </motion.div>
    </Container>
  );
}
