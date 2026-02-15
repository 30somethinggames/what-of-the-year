import { describe, expect, it } from "bun:test";

import { STALE_TIME, handleError } from "../utils";

describe("handleError", () => {
  it("throws with api name, status code, and error text", async () => {
    const response = new Response("Something went wrong", { status: 500 });

    expect(handleError("TMDB", response)).rejects.toThrow(
      "TMDB API error (500): Something went wrong",
    );
  });

  it("falls back to statusText when body is empty", async () => {
    const response = new Response("", { status: 404, statusText: "Not Found" });

    expect(handleError("IGDB", response)).rejects.toThrow("IGDB API error (404): Not Found");
  });
});

describe("STALE_TIME", () => {
  it("equals 5 minutes in milliseconds", () => {
    expect(STALE_TIME).toBe(300_000);
  });
});
