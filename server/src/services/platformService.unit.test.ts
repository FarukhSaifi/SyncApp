
import { PLATFORMS } from "@constants";
import { NotFoundError } from "@middleware/errorHandler";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();

vi.mock("@models/Post", () => ({
  default: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

import { getPlatformStatus, unpublishFromPlatform } from "./platformService";

describe("platformService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPlatformStatus returns default when platform unset", async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ platform_status: {} }),
      }),
    });

    const status = await getPlatformStatus("p1", PLATFORMS.DEVTO);
    expect(status.platform).toBe(PLATFORMS.DEVTO);
    expect(status.status.published).toBe(false);
  });

  it("getPlatformStatus throws when post missing", async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });
    await expect(getPlatformStatus("missing", PLATFORMS.DEVTO)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("unpublishFromPlatform clears platform fields", async () => {
    mockFindById.mockResolvedValue({ _id: "p1" });
    mockFindByIdAndUpdate.mockReturnValue({
      populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "p1" }) }),
    });

    await unpublishFromPlatform("p1", PLATFORMS.MEDIUM);
    expect(mockFindByIdAndUpdate).toHaveBeenCalledOnce();
  });
});
