import type { TopicType } from "constants/topics";
import type { SessionID } from "types/backend";

export interface LobbyProps {
  topic: TopicType;
  year: string;
  sessionId: SessionID;
}
