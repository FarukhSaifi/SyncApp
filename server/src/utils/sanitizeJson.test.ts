import { describe, expect, it } from "vitest";

import { sanitizeJsonString } from "./sanitizeJson";

describe("sanitizeJsonString", () => {
  it("escapes literal newlines inside JSON string values", () => {
    const raw = '{"title":"line one\nline two"}';
    const sanitized = sanitizeJsonString(raw);
    expect(JSON.parse(sanitized)).toEqual({ title: "line one\nline two" });
  });

  it("leaves structural whitespace outside strings unchanged", () => {
    const raw = '{\n  "a": 1\n}';
    expect(sanitizeJsonString(raw)).toBe(raw);
  });

  it("escapes tab and carriage return inside strings", () => {
    const raw = '{"x":"a\tb\rc"}';
    const sanitized = sanitizeJsonString(raw);
    expect(JSON.parse(sanitized)).toEqual({ x: "a\tb\rc" });
  });

  it("respects backslash escapes inside strings", () => {
    const raw = String.raw`{"path":"C:\\Users\\name"}`;
    const sanitized = sanitizeJsonString(raw);
    expect(JSON.parse(sanitized)).toEqual({ path: "C:\\Users\\name" });
  });
});
