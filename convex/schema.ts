import { authTables } from "@convex-dev/auth/server";

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { SessionStatus } from "./constants";

export default defineSchema({
  ...authTables,
  sessions: defineTable({
    topic: v.string(),
    year: v.number(),
    maxRounds: v.number(),
    maxPlayers: v.number(),
    playerCount: v.number(),
    activeRoundNumber: v.number(),
    status: v.union(
      v.literal(SessionStatus.LOBBY),
      v.literal(SessionStatus.ACTIVE),
      v.literal(SessionStatus.ENDED),
    ),
  }),

  players: defineTable({
    sessionId: v.id("sessions"),
    uid: v.string(),
    name: v.string(),
    avatar: v.string(),
    isHost: v.boolean(),
  }).index("by_session_uid", ["sessionId", "uid"]),

  rounds: defineTable({
    sessionId: v.id("sessions"),
    number: v.number(),
    state: v.union(
      v.literal("pending"),
      v.literal("open"),
      v.literal("closed"),
      v.literal("revealing"),
    ),
    weight: v.number(),
    selectionsComplete: v.number(),
    startedAt: v.union(v.number(), v.null()),
    closedAt: v.union(v.number(), v.null()),
    revealJobId: v.optional(v.id("_scheduled_functions")),
    revealEndsAt: v.optional(v.number()),
  }).index("by_session", ["sessionId"]),

  selections: defineTable({
    sessionId: v.id("sessions"),
    roundId: v.id("rounds"),
    uid: v.string(),
    pick: v.object({
      id: v.string(),
      name: v.string(),
      cover: v.optional(v.string()),
      rating: v.optional(v.number()),
      first_release_date: v.optional(v.number()),
      summary: v.optional(v.string()),
    }),
    points: v.number(),
    roundNumber: v.number(),
    savedAt: v.number(),
  })
    .index("by_round_uid", ["roundId", "uid"])
    .index("by_session", ["sessionId"]),

  // Third-party responses (option lists per topic/year, the IGDB access token),
  // keyed by `utils/cache` key builders. One row per key — writes overwrite,
  // so the table stays bounded and needs no sweeper.
  apiCache: defineTable({
    key: v.string(),
    value: v.any(),
    expiresAt: v.number(),
  }).index("by_key", ["key"]),
});
