import { httpRouter } from "convex/server";

import { auth } from "./auth";
import { addPlayer, cleanup, makeSelection } from "./test/http";

const http = httpRouter();
auth.addHttpRoutes(http);

// Test-only routes for e2e multiplayer simulation.
// These bypass auth to seed data for simulated players.
if (process.env.IS_TEST === "true") {
  http.route({ path: "/test/add-player", method: "POST", handler: addPlayer });
  http.route({ path: "/test/make-selection", method: "POST", handler: makeSelection });
  http.route({ path: "/test/cleanup", method: "POST", handler: cleanup });
}

export default http;
