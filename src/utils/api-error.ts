import type { ApiErrorData, ErrorCode } from "convex/utils/errors";
import { ConvexError } from "convex/values";

/** Client-only codes for failures that did not originate from `apiError`. */
type ClientErrorCode = ErrorCode | "RATE_LIMITED" | "UNKNOWN";

export type ClientError = { code: ClientErrorCode; message: string };

const RATE_LIMITED: ClientError = { code: "RATE_LIMITED", message: "Slow down and try again" };
const UNKNOWN: ClientError = { code: "UNKNOWN", message: "Something went wrong" };

function isApiErrorData(data: unknown): data is ApiErrorData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as ApiErrorData).code === "string" &&
    typeof (data as ApiErrorData).message === "string"
  );
}

/**
 * Normalizes anything thrown by a Convex call into `{ code, message }`.
 * Never surfaces the underlying message for non-app errors — on prod it is
 * redacted to "Server Error" anyway, and on dev it may leak internals.
 */
export function getApiError(error: unknown): ClientError {
  if (!(error instanceof ConvexError)) return UNKNOWN;
  const data: unknown = error.data;
  if (isApiErrorData(data)) return { code: data.code, message: data.message };
  // Shape thrown by @convex-dev/rate-limiter with `throws: true`.
  if (
    typeof data === "object" &&
    data !== null &&
    (data as { kind?: unknown }).kind === "RateLimited"
  )
    return RATE_LIMITED;
  return UNKNOWN;
}
