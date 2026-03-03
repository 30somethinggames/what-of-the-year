import type { TopicType } from "constants/topics";
import type { SessionID } from "db/types";

export interface LobbyProps {
  topic: TopicType;
  year: string;
  sessionId: SessionID;
}
