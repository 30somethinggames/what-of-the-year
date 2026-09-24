import { describe, expect, it } from "bun:test";

import { ConvexError } from "convex/values";
import { errorData } from "db/error-data";

describe("errorData", () => {
  it("unwraps the data a backend error carries", () => {
    const error = new ConvexError({ code: "NOT_HOST", message: "Only the host can kick players" });
    expect(errorData(error)).toEqual({
      code: "NOT_HOST",
      message: "Only the host can kick players",
    });
  });

  it("returns undefined for anything else", () => {
    expect(errorData(new Error("db exploded"))).toBeUndefined();
    expect(errorData("nope")).toBeUndefined();
    expect(errorData(undefined)).toBeUndefined();
  });
});
