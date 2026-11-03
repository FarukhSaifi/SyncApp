import { beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import { ensureDb } from "./ensureDb";

vi.mock("@database/connection", () => ({
  default: vi.fn(),
}));

describe("ensureDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls next when connectDB succeeds", async () => {
    const connectDB = (await import("@database/connection")).default as ReturnType<typeof vi.fn>;
    connectDB.mockResolvedValue(undefined);

    const next = vi.fn();
    const json = vi.fn();
    const res = { status: vi.fn().mockReturnValue({ json }) };

    await ensureDb({} as never, res as never, next);

    expect(connectDB).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 503 when connectDB fails", async () => {
    const connectDB = (await import("@database/connection")).default as ReturnType<typeof vi.fn>;
    connectDB.mockRejectedValue(new Error("down"));

    const next = vi.fn();
    const json = vi.fn();
    const res = { status: vi.fn().mockReturnValue({ json }) };

    await ensureDb({} as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.DATABASE_UNAVAILABLE,
    });
  });
});
