import { SEO_IMPROVE_LIMITS } from "@constants";
import { describe, expect, it } from "vitest";


import { improveSeoRequestSchema } from "./index";

describe("improveSeoRequestSchema", () => {
  it("rejects empty targets", () => {
    const result = improveSeoRequestSchema.safeParse({ targets: [] });
    expect(result.success).toBe(false);
  });

  it("rejects overlong currentValue", () => {
    const result = improveSeoRequestSchema.safeParse({
      targets: [
        {
          id: "title",
          field: "title",
          issue: "Title too short",
          currentValue: "x".repeat(SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX + 1),
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("parses a valid payload and applies defaults", () => {
    const result = improveSeoRequestSchema.safeParse({
      targets: [
        {
          id: "title",
          field: "title",
          issue: "Title too short",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targets[0].currentValue).toBe("");
      expect(result.data.targets[0].applyMode).toBe("replace");
    }
  });
});
