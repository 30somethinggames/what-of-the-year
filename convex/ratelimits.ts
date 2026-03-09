import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createSession: { kind: "token bucket", rate: 5, period: MINUTE },
  joinSession: { kind: "token bucket", rate: 10, period: MINUTE },
  saveSelection: { kind: "token bucket", rate: 20, period: MINUTE },
});
