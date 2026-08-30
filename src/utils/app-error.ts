import type { AppErrorData, ErrorCode } from "convex/utils/errors";
import { ConvexError } from "convex/values";

/** Client-only codes for failures that did not originate from `appError`. */
type ClientErrorCode = ErrorCode | "RATE_LIMITED" | "UNKNOWN";

export type ClientError = { code: ClientErrorCode; message: string };

const RATE_LIMITED: ClientError = { code: "RATE_LIMITED", message: "Slow down and try again" };
const UNKNOWN: ClientError = { code: "UNKNOWN", message: "Something went wrong" };

function isAppErrorData(data: unknown): data is AppErrorData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as AppErrorData).code === "string" &&
    typeof (data as AppErrorData).message === "string"
  );
}

/**
 * Normalizes anything thrown by a Convex call into `{ code, message }`.
 * Never surfaces the underlying message for non-app errors — on prod it is
 * redacted to "Server Error" anyway, and on dev it may leak internals.
 */
export function getAppError(error: unknown): ClientError {
  if (!(error instanceof ConvexError)) return UNKNOWN;
  const data: unknown = error.data;
  if (isAppErrorData(data)) return { code: data.code, message: data.message };
  // Shape thrown by @convex-dev/rate-limiter with `throws: true`.
  if (
    typeof data === "object" &&
    data !== null &&
    (data as { kind?: unknown }).kind === "RateLimited"
  )
    return RATE_LIMITED;
  return UNKNOWN;
}
