import type { TopicType } from "constants/topics";
import type { SessionID } from "db/types";

export interface SessionProps {
  topic: TopicType;
  year: string;
  sessionId: SessionID;
}
