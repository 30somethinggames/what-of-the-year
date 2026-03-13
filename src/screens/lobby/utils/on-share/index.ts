import * as Linking from "expo-linking";
import { Share } from "react-native";

import type { TopicType } from "constants/topics";

type Args = {
  topic: TopicType;
  year: string;
  sessionId: string;
};
export const onShare = async ({ topic, year, sessionId }: Args) => {
  const url = Linking.createURL(`/${topic.value}/${year}`, {
    queryParams: { sessionId },
  });

  await Share.share({
    message: `Join my ${topic.label} of ${year}!\n${url}`,
  });
};
