import { describe, expect, it } from "bun:test";

import { ConvexError } from "convex/values";

import { apiError } from "../utils/errors";

describe("apiError", () => {
  it("returns a ConvexError carrying exactly { code, message }", () => {
    const error = apiError("NOT_HOST", "Only the host can kick players");
    expect(error).toBeInstanceOf(ConvexError);
    expect(error.data).toEqual({ code: "NOT_HOST", message: "Only the host can kick players" });
  });
});
