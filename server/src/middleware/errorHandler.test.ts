import { config } from "@config";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HTTP_STATUS } from "@constants/httpStatus";
import { ERROR_MESSAGES } from "@constants/messages";

import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
} from "./errorHandler";

function mockRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
}

describe("errorHandler", () => {
  afterEach(() => {
    config.nodeEnv = "test";
  });

  it("maps AppError to JSON response", () => {
    const res = mockRes();
    const err = new AppError("bad", HTTP_STATUS.BAD_REQUEST, { field: "x" });
    errorHandler(err, { method: "GET", path: "/x" } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "bad", details: { field: "x" } }),
    );
  });

  it("maps Mongo ValidationError name to 400", () => {
    const res = mockRes();
    const mongoErr = Object.assign(new Error("fail"), {
      name: "ValidationError",
      errors: { email: { message: "invalid email" } },
    });
    errorHandler(mongoErr as never, { method: "POST", path: "/u" } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
  });

  it("maps axios response errors", () => {
    const res = mockRes();
    const axiosErr = Object.assign(new Error("upstream"), {
      isAxiosError: true,
      response: { status: 502, data: { message: "Bad gateway" } },
    });
    errorHandler(axiosErr as never, { method: "GET", path: "/ext" } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Bad gateway" }));
  });

  it("maps axios network and string response bodies", () => {
    const resNoResponse = mockRes();
    const networkErr = Object.assign(new Error("timeout"), {
      isAxiosError: true,
      request: {},
    });
    errorHandler(networkErr as never, { method: "GET", path: "/ext" } as never, resNoResponse as never, vi.fn());
    expect(resNoResponse.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);

    const resString = mockRes();
    const stringBodyErr = Object.assign(new Error("upstream"), {
      isAxiosError: true,
      response: { status: 400, data: "plain text failure" },
    });
    errorHandler(stringBodyErr as never, { method: "GET", path: "/ext" } as never, resString as never, vi.fn());
    expect(resString.status).toHaveBeenCalledWith(400);
    expect(resString.json).toHaveBeenCalledWith(expect.objectContaining({ error: "plain text failure" }));
  });

  it("maps duplicate key and cast errors", () => {
    const res = mockRes();
    const dup = Object.assign(new Error("dup"), { code: 11000, keyPattern: { email: 1 } });
    errorHandler(dup as never, { method: "POST", path: "/u" } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);

    const resCast = mockRes();
    const cast = Object.assign(new Error("cast"), { name: "CastError" });
    errorHandler(cast as never, { method: "GET", path: "/p" } as never, resCast as never, vi.fn());
    expect(resCast.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
  });

  it("notFoundHandler forwards NotFoundError", () => {
    const next = vi.fn();
    notFoundHandler({ originalUrl: "/missing" } as never, mockRes() as never, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it("asyncHandler forwards rejections to next", async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => {
      throw new UnauthorizedError();
    });
    await handler({} as never, mockRes() as never, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("maps unknown errors to 500", () => {
    const res = mockRes();
    errorHandler(new Error("unexpected"), { method: "GET", path: "/x" } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("maps axios setup errors without response or request metadata", () => {
    const res = mockRes();
    const setupErr = Object.assign(new Error("axios setup"), { isAxiosError: true });
    errorHandler(setupErr as never, { method: "GET", path: "/ext" } as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "axios setup" }));
  });

  it("includes stack traces in development responses", () => {
    config.nodeEnv = "development";
    const res = mockRes();
    const err = new Error("dev failure");
    errorHandler(err, { method: "GET", path: "/x" } as never, res as never, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stack: expect.stringContaining("dev failure") }));
  });

  it("error subclasses expose expected status codes", () => {
    expect(new ValidationError("v").statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(new ForbiddenError().statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect(new NotFoundError().message).toBe(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
  });
});
