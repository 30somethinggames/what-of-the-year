import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "reset dev database",
  { hourUTC: 7, minuteUTC: 0 }, // 2am Eastern (UTC-5)
  internal.reset.clearAll,
);

export default crons;
