import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";
import { isProd } from "./utils/env";

const crons = cronJobs();

// Dev/staging only: wipes every table. Evaluated at deploy time (see utils/env).
if (!isProd()) {
  crons.daily(
    "reset dev database",
    { hourUTC: 7, minuteUTC: 0 }, // 2am Eastern (UTC-5)
    internal.reset.clearAll,
  );
}

export default crons;
