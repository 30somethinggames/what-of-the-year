import type { ApiErrorData, ErrorCode } from "shared/errors";

import { errorData } from "db/error-data";

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

/** Maps the data an error carried into `{ code, message }`. */
export function toClientError(data: unknown): ClientError {
  if (isApiErrorData(data)) return { code: data.code, message: data.message };
  // Shape thrown by the rate limiter with `throws: true`.
  if (
    typeof data === "object" &&
    data !== null &&
    (data as { kind?: unknown }).kind === "RateLimited"
  )
    return RATE_LIMITED;
  return UNKNOWN;
}

/**
 * Normalizes anything thrown by a backend call into `{ code, message }`.
 * Never surfaces the underlying message for non-app errors — on prod it is
 * redacted to "Server Error" anyway, and on dev it may leak internals.
 */
export function getApiError(error: unknown): ClientError {
  return toClientError(errorData(error));
}
