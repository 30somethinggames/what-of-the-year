import { ConvexError } from "convex/values";

import type { ApiErrorData, ErrorCode } from "../../src/shared/errors";

/**
 * Build a client-visible error: `throw apiError("NOT_HOST", "Only the host can kick players")`.
 * Plain `Error` messages are redacted on prod deployments; only
 * `ConvexError.data` reaches the client.
 */
export function apiError(code: ErrorCode, message: string): ConvexError<ApiErrorData> {
  return new ConvexError({ code, message });
}
