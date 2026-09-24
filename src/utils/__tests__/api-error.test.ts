import { describe, expect, it } from "bun:test";

import { getApiError, toClientError } from "utils/api-error";

describe("toClientError", () => {
  it("passes through app errors unchanged", () => {
    expect(
      toClientError({ code: "ALREADY_JOINED", message: "Already joined this session" }),
    ).toEqual({ code: "ALREADY_JOINED", message: "Already joined this session" });
  });

  it("maps the rate-limiter's data to RATE_LIMITED", () => {
    expect(toClientError({ kind: "RateLimited", name: "joinSession", retryAfter: 1200 })).toEqual({
      code: "RATE_LIMITED",
      message: "Slow down and try again",
    });
  });

  it("falls back for data it does not recognize", () => {
    expect(toClientError(undefined).code).toBe("UNKNOWN");
    expect(toClientError("string data").code).toBe("UNKNOWN");
    expect(toClientError({ code: 42 }).code).toBe("UNKNOWN");
  });
});

describe("getApiError", () => {
  it("does not leak a plain Error's message", () => {
    expect(getApiError(new Error("db exploded"))).toEqual({
      code: "UNKNOWN",
      message: "Something went wrong",
    });
  });

  it("falls back for non-Error throwables", () => {
    expect(getApiError("nope").code).toBe("UNKNOWN");
    expect(getApiError(undefined).code).toBe("UNKNOWN");
  });
});
