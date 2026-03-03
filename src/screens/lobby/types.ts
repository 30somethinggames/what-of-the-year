import type { Id } from "convex/_generated/dataModel";

import type { TopicType } from "constants/topics";

export interface LobbyProps {
  topic: TopicType;
  year: string;
  sessionId: Id<"sessions">;
}
