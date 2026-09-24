import { ConvexError } from "convex/values";

/**
 * The data a backend error carries, or `undefined` for anything else.
 * The only place the client reads the backend's own error type.
 */
export function errorData(error: unknown): unknown {
  return error instanceof ConvexError ? error.data : undefined;
}
