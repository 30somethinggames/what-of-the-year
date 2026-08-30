import { ConvexError } from "convex/values";

/**
 * Codes for user-facing failures. `code` is for branching in the client,
 * `message` is for humans. Plain `Error` messages are redacted on prod
 * deployments; only `ConvexError.data` reaches the client.
 */
export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  NOT_FOUND: "NOT_FOUND",
  NOT_MEMBER: "NOT_MEMBER",
  NOT_HOST: "NOT_HOST",
  WRONG_STATE: "WRONG_STATE",
  SESSION_FULL: "SESSION_FULL",
  SESSION_CLOSED: "SESSION_CLOSED",
  ALREADY_JOINED: "ALREADY_JOINED",
  ALREADY_SELECTED: "ALREADY_SELECTED",
  HOST_CANNOT_LEAVE: "HOST_CANNOT_LEAVE",
  CANNOT_KICK_HOST: "CANNOT_KICK_HOST",
  VALIDATION: "VALIDATION",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type ApiErrorData = { code: ErrorCode; message: string };

/** Build a client-visible error: `throw apiError("NOT_HOST", "Only the host can kick players")`. */
export function apiError(code: ErrorCode, message: string): ConvexError<ApiErrorData> {
  return new ConvexError({ code, message });
}
