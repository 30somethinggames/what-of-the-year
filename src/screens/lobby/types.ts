import type { TopicType } from "constants/topics";

export interface LobbyProps {
  topic: TopicType;
  year: string;
  sessionId: string;
}
