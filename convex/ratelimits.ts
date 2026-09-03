import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createSession: { kind: "token bucket", rate: 5, period: MINUTE },
  joinSession: { kind: "token bucket", rate: 10, period: MINUTE },
  saveSelection: { kind: "token bucket", rate: 20, period: MINUTE },
  editSelection: { kind: "token bucket", rate: 20, period: MINUTE },
  advanceRound: { kind: "token bucket", rate: 30, period: MINUTE },
  // Option actions: one fetch per topic/year, cached server-side afterwards.
  getMovies: { kind: "token bucket", rate: 10, period: MINUTE },
  getGames: { kind: "token bucket", rate: 10, period: MINUTE },
  getBooks: { kind: "token bucket", rate: 10, period: MINUTE },
  // Unauthenticated health probe (no key, so one global bucket): each call hits
  // every third-party API once, and the scheduled check needs one a week.
  healthUpstreams: { kind: "fixed window", rate: 6, period: HOUR },
});
