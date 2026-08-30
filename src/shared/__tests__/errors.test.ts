import { describe, expect, it } from "bun:test";

import { appError } from "convex/utils/errors";
import { ConvexError } from "convex/values";

describe("appError", () => {
  it("returns a ConvexError carrying exactly { code, message }", () => {
    const error = appError("NOT_HOST", "Only the host can kick players");
    expect(error).toBeInstanceOf(ConvexError);
    expect(error.data).toEqual({ code: "NOT_HOST", message: "Only the host can kick players" });
  });
});
