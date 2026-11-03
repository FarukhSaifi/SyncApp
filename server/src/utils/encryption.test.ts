import crypto from "crypto";

import { config } from "@config";
import { describe, expect, it, vi } from "vitest";

import { decryptCredential, encryptCredential } from "./encryption";

describe("encryptCredential / decryptCredential", () => {
  it("round-trips plaintext with AES-256-GCM packing", () => {
    const plaintext = "super-secret-api-key";
    const packed = encryptCredential(plaintext);
    expect(packed.split(":")).toHaveLength(3);
    expect(decryptCredential(packed)).toBe(plaintext);
  });

  it("returns empty string for empty decrypt input", () => {
    expect(decryptCredential("")).toBe("");
  });

  it("throws when ciphertext auth tag is tampered", () => {
    const packed = encryptCredential("tamper-me");
    const [iv, tag, cipher] = packed.split(":");
    const flipped = tag.startsWith("a") ? `b${tag.slice(1)}` : `a${tag.slice(1)}`;
    expect(() => decryptCredential(`${iv}:${flipped}:${cipher}`)).toThrow();
  });

  it("derives key material when encryption key is not valid hex", () => {
    const original = config.encryption.key;
    config.encryption.key = "not-a-hex-key-but-still-long-enough-for-sha256-derivation-path!!";
    const packed = encryptCredential("derived-key-path");
    expect(decryptCredential(packed)).toBe("derived-key-path");
    config.encryption.key = original;
  });

  it("wraps encrypt failures with FAILED_TO_ENCRYPT", () => {
    vi.spyOn(crypto, "createCipheriv").mockImplementation(() => {
      throw new Error("cipher init failed");
    });
    expect(() => encryptCredential("x")).toThrow(/encrypt/i);
    vi.restoreAllMocks();
  });
});
