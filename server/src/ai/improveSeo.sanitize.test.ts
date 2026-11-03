import { AppError } from "@middleware/errorHandler";
import { describe, expect, it } from "vitest";


import { improveSeoFromScorecard } from "./improveSeo";

describe("improveSeoFromScorecard sanitize", () => {
  it("rejects empty targets with AppError without calling the LLM", async () => {
    await expect(improveSeoFromScorecard({ targets: [] })).rejects.toBeInstanceOf(AppError);
  });

  it("rejects targets that sanitize to nothing", async () => {
    await expect(
      improveSeoFromScorecard({
        targets: [{ id: "", field: "not-a-field", issue: "" }],
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
