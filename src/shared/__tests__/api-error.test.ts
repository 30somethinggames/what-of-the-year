import { describe, expect, it } from "bun:test";

import { apiError } from "convex/utils/errors";
import { ConvexError } from "convex/values";
import { getApiError } from "utils/api-error";

describe("getApiError", () => {
  it("passes through app errors unchanged", () => {
    const error = apiError("ALREADY_JOINED", "Already joined this session");
    expect(getApiError(error)).toEqual({
      code: "ALREADY_JOINED",
      message: "Already joined this session",
    });
  });

  it("maps the rate-limiter's ConvexError to RATE_LIMITED", () => {
    const error = new ConvexError({ kind: "RateLimited", name: "joinSession", retryAfter: 1200 });
    expect(getApiError(error)).toEqual({
      code: "RATE_LIMITED",
      message: "Slow down and try again",
    });
  });

  it("does not leak a plain Error's message", () => {
    expect(getApiError(new Error("db exploded"))).toEqual({
      code: "UNKNOWN",
      message: "Something went wrong",
    });
  });

  it("falls back for non-Error throwables and unrecognized ConvexError data", () => {
    expect(getApiError("nope").code).toBe("UNKNOWN");
    expect(getApiError(undefined).code).toBe("UNKNOWN");
    expect(getApiError(new ConvexError("string data")).code).toBe("UNKNOWN");
    expect(getApiError(new ConvexError({ code: 42 })).code).toBe("UNKNOWN");
  });
});
