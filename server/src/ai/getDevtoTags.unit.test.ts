import { beforeEach, describe, expect, it, vi } from "vitest";

describe("getDevtoReachTags", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { name: "javascript" },
          { name: "webdev" },
          { name: "react" },
          { name: "node" },
        ],
      })) as never,
    );
  });

  it("throws when DEV.to tags API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => [] })) as never,
    );
    const { getDevtoReachTags } = await import("./getDevtoTags");
    await expect(getDevtoReachTags({ refresh: true })).rejects.toMatchObject({ statusCode: 502 });
    vi.unstubAllGlobals();
  });

  it("fetches and caches popular tags", async () => {
    const { getDevtoReachTags } = await import("./getDevtoTags");
    const first = await getDevtoReachTags({ refresh: true });
    expect(first.tags).toContain("javascript");
    expect(first.cached).toBe(false);

    const second = await getDevtoReachTags();
    expect(second.cached).toBe(true);
    vi.unstubAllGlobals();
  });
});
