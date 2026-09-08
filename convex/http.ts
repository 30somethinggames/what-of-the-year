import { httpRouter } from "convex/server";

import { auth } from "./auth";
import { upstreams } from "./health";
import { addPlayer, cleanup, createSession, makeSelection, seedGame } from "./test/http";
import { testRoutesEnabled } from "./utils/env";

const http = httpRouter();
auth.addHttpRoutes(http);

if (testRoutesEnabled()) {
  http.route({ path: "/test/create-session", method: "POST", handler: createSession });
  http.route({ path: "/test/seed-game", method: "POST", handler: seedGame });
  http.route({ path: "/test/add-player", method: "POST", handler: addPlayer });
  http.route({ path: "/test/make-selection", method: "POST", handler: makeSelection });
  http.route({ path: "/test/cleanup", method: "POST", handler: cleanup });
}

// Unauthenticated but globally rate limited — see convex/health.ts.
http.route({ path: "/health/upstreams", method: "GET", handler: upstreams });

export default http;
