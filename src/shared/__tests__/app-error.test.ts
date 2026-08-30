import { describe, expect, it } from "bun:test";

import { appError } from "convex/utils/errors";
import { ConvexError } from "convex/values";
import { getAppError } from "utils/app-error";

describe("getAppError", () => {
  it("passes through app errors unchanged", () => {
    const error = appError("ALREADY_JOINED", "Already joined this session");
    expect(getAppError(error)).toEqual({
      code: "ALREADY_JOINED",
      message: "Already joined this session",
    });
  });

  it("maps the rate-limiter's ConvexError to RATE_LIMITED", () => {
    const error = new ConvexError({ kind: "RateLimited", name: "joinSession", retryAfter: 1200 });
    expect(getAppError(error)).toEqual({
      code: "RATE_LIMITED",
      message: "Slow down and try again",
    });
  });

  it("does not leak a plain Error's message", () => {
    expect(getAppError(new Error("db exploded"))).toEqual({
      code: "UNKNOWN",
      message: "Something went wrong",
    });
  });

  it("falls back for non-Error throwables and unrecognized ConvexError data", () => {
    expect(getAppError("nope").code).toBe("UNKNOWN");
    expect(getAppError(undefined).code).toBe("UNKNOWN");
    expect(getAppError(new ConvexError("string data")).code).toBe("UNKNOWN");
    expect(getAppError(new ConvexError({ code: 42 })).code).toBe("UNKNOWN");
  });
});
