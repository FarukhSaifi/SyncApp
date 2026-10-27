import { AI_CONFIG, DEFAULT_VALUES } from "@constants";
import { describe, expect, it } from "vitest";


import {
  keywordResearchRequestSchema,
  presignedUrlRequestSchema,
  upsertCredentialSchema,
} from "./index";

describe("upsertCredentialSchema", () => {
  it("requires api_key", () => {
    expect(upsertCredentialSchema.safeParse({}).success).toBe(false);
  });

  it("accepts api_key with optional empty site_url", () => {
    const result = upsertCredentialSchema.safeParse({ api_key: "sk-test", site_url: "" });
    expect(result.success).toBe(true);
  });
});

describe("keywordResearchRequestSchema", () => {
  it("rejects seeds that are too short", () => {
    expect(keywordResearchRequestSchema.safeParse({ seed: "a" }).success).toBe(false);
  });

  it("accepts a valid seed", () => {
    const seed = "x".repeat(Math.max(AI_CONFIG["SEED_MIN_LEN"], 3));
    expect(keywordResearchRequestSchema.safeParse({ seed }).success).toBe(true);
  });
});

describe("presignedUrlRequestSchema", () => {
  it("rejects invalid content types", () => {
    const result = presignedUrlRequestSchema.safeParse({
      filename: "x.bin",
      size: 100,
      contentType: "application/octet-stream",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an allowed image mime within size limit", () => {
    const mime = (DEFAULT_VALUES["ALLOWED_UPLOAD_IMAGE_MIMES"] as readonly string[])[0];
    const result = presignedUrlRequestSchema.safeParse({
      filename: "cover.png",
      size: 1024,
      contentType: mime,
    });
    expect(result.success).toBe(true);
  });
});
