import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { HTTP_STATUS } from "@constants/httpStatus";

import { validateBody } from "./validation";

describe("validateBody", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("calls next and assigns parsed body on success", () => {
    const req = { body: { name: "SyncApp" } };
    const json = vi.fn();
    const res = { status: vi.fn().mockReturnValue({ json }) };
    const next = vi.fn();

    validateBody(schema)(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "SyncApp" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with validation message on failure", () => {
    const req = { body: {} };
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status };
    const next = vi.fn();

    validateBody(schema)(req as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining("Validation error"),
      }),
    );
  });
});
