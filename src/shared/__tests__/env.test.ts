import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { isProd, testRoutesEnabled, timingSafeEqual, useFixtures } from "convex/utils/env";

const KEYS = ["IS_PROD", "OPTIONS_FIXTURES", "TEST_SECRET"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("isProd", () => {
  it("is false when IS_PROD is unset or empty", () => {
    expect(isProd()).toBe(false);
    process.env.IS_PROD = "";
    expect(isProd()).toBe(false);
  });

  it("is true for any non-empty value, including 'false'", () => {
    process.env.IS_PROD = "true";
    expect(isProd()).toBe(true);
    process.env.IS_PROD = "1";
    expect(isProd()).toBe(true);
    process.env.IS_PROD = "false";
    expect(isProd()).toBe(true);
  });
});

describe("useFixtures", () => {
  it("is false when OPTIONS_FIXTURES is unset", () => {
    expect(useFixtures()).toBe(false);
  });

  it("is true when OPTIONS_FIXTURES is set off prod", () => {
    process.env.OPTIONS_FIXTURES = "1";
    expect(useFixtures()).toBe(true);
  });

  it("is false on prod even when OPTIONS_FIXTURES is set", () => {
    process.env.OPTIONS_FIXTURES = "1";
    process.env.IS_PROD = "true";
    expect(useFixtures()).toBe(false);
  });
});

describe("testRoutesEnabled", () => {
  it("is false when TEST_SECRET is unset", () => {
    expect(testRoutesEnabled()).toBe(false);
  });

  it("is true when TEST_SECRET is set off prod", () => {
    process.env.TEST_SECRET = "abc";
    expect(testRoutesEnabled()).toBe(true);
  });

  it("is false on prod even when TEST_SECRET is set", () => {
    process.env.TEST_SECRET = "abc";
    process.env.IS_PROD = "true";
    expect(testRoutesEnabled()).toBe(false);
  });
});

describe("timingSafeEqual", () => {
  it("is true for identical strings", () => {
    expect(timingSafeEqual("deadbeef", "deadbeef")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("is false for same-length differing strings", () => {
    expect(timingSafeEqual("deadbeef", "deadbeeg")).toBe(false);
    expect(timingSafeEqual("aaaa", "aaab")).toBe(false);
  });

  it("is false for different-length strings", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("abc", "")).toBe(false);
  });

  it("compares non-ASCII strings by bytes", () => {
    expect(timingSafeEqual("héllo", "héllo")).toBe(true);
    expect(timingSafeEqual("héllo", "hello")).toBe(false);
    expect(timingSafeEqual("é", "é")).toBe(false);
  });
});
