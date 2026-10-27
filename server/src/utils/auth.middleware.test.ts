import { afterEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { USER_ROLES } from "@constants/userRoles";

import { authenticateToken, generateToken, optionalAuth, requireAdmin } from "./auth";

function mockReqRes(headers: Record<string, string> = {}) {
  const req = { headers, userId: undefined as string | undefined };
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json };
  const next = vi.fn();
  return { req, res, next };
}

describe("auth middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("authenticateToken rejects missing token", () => {
    const { req, res, next } = mockReqRes();
    authenticateToken(req as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    expect(next).not.toHaveBeenCalled();
  });

  it("authenticateToken sets userId for valid JWT", () => {
    const token = generateToken("uid-abc");
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    authenticateToken(req as never, res as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("uid-abc");
  });

  it("optionalAuth continues without token", () => {
    const { req, res, next } = mockReqRes();
    optionalAuth(req as never, res as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBeUndefined();
  });

  it("optionalAuth sets userId when token valid", () => {
    const token = generateToken("uid-opt");
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    optionalAuth(req as never, res as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("uid-opt");
  });

  it("requireAdmin rejects non-admin users", async () => {
    const User = (await import("@models/User")).default;
    vi.spyOn(User, "findById").mockReturnValue({
      select: () => Promise.resolve({ role: USER_ROLES.USER }),
    } as never);

    const { req, res, next } = mockReqRes();
    req.userId = "u1";
    await requireAdmin(req as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAdmin returns 404 when user missing", async () => {
    const User = (await import("@models/User")).default;
    vi.spyOn(User, "findById").mockReturnValue({
      select: () => Promise.resolve(null),
    } as never);
    const { req, res, next } = mockReqRes();
    req.userId = "missing";
    await requireAdmin(req as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
  });

  it("requireAdmin maps lookup failures to 500", async () => {
    const User = (await import("@models/User")).default;
    vi.spyOn(User, "findById").mockReturnValue({
      select: () => Promise.reject(new Error("db down")),
    } as never);
    const { req, res, next } = mockReqRes();
    req.userId = "u1";
    await requireAdmin(req as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
