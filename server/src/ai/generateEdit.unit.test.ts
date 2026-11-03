import { AppError } from "@middleware/errorHandler";
import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  buildModelCandidates: vi.fn(() => ["gemini-test"]),
  generateAiContent: vi.fn(),
  getModelName: vi.fn(() => "gemini-test"),
  getText: vi.fn(),
}));

vi.mock("./retries", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

import { generateAiContent, getText } from "./client";
import { generateEdit } from "./generateEdit";

describe("generateEdit", () => {
  it("rejects empty context", async () => {
    await expect(generateEdit("shorten", "   ")).rejects.toBeInstanceOf(AppError);
  });

  it("returns trimmed model text", async () => {
    vi.mocked(generateAiContent).mockResolvedValue({} as never);
    vi.mocked(getText).mockReturnValue("  edited snippet  ");
    const out = await generateEdit("shorten", "Long paragraph text.");
    expect(out.trim()).toBe("edited snippet");
  });
});
