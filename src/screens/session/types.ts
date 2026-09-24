import type { TopicType } from "constants/topics";
import type { SessionID } from "types/backend";

export interface SessionProps {
  topic: TopicType;
  year: string;
  sessionId: SessionID;
}
