/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cache from "../cache.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as igdb from "../igdb.js";
import type * as openlibrary from "../openlibrary.js";
import type * as players from "../players.js";
import type * as ratelimits from "../ratelimits.js";
import type * as reset from "../reset.js";
import type * as rounds from "../rounds.js";
import type * as selections from "../selections.js";
import type * as sessions from "../sessions.js";
import type * as test_fixtures from "../test/fixtures.js";
import type * as test_http from "../test/http.js";
import type * as test_seed from "../test/seed.js";
import type * as tmdb from "../tmdb.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_cache from "../utils/cache.js";
import type * as utils_dates from "../utils/dates.js";
import type * as utils_env from "../utils/env.js";
import type * as utils_errors from "../utils/errors.js";
import type * as utils_pick from "../utils/pick.js";
import type * as utils_rounds from "../utils/rounds.js";
import type * as utils_validate from "../utils/validate.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cache: typeof cache;
  constants: typeof constants;
  crons: typeof crons;
  health: typeof health;
  http: typeof http;
  igdb: typeof igdb;
  openlibrary: typeof openlibrary;
  players: typeof players;
  ratelimits: typeof ratelimits;
  reset: typeof reset;
  rounds: typeof rounds;
  selections: typeof selections;
  sessions: typeof sessions;
  "test/fixtures": typeof test_fixtures;
  "test/http": typeof test_http;
  "test/seed": typeof test_seed;
  tmdb: typeof tmdb;
  "utils/auth": typeof utils_auth;
  "utils/cache": typeof utils_cache;
  "utils/dates": typeof utils_dates;
  "utils/env": typeof utils_env;
  "utils/errors": typeof utils_errors;
  "utils/pick": typeof utils_pick;
  "utils/rounds": typeof utils_rounds;
  "utils/validate": typeof utils_validate;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
