import { config } from "@config";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { generateToken } from "./auth";

describe("generateToken", () => {
  it("issues a JWT that verifies with config secret", () => {
    const token = generateToken("user-123");
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    expect(decoded.userId).toBe("user-123");
  });
});
