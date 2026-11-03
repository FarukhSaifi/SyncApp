import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";


const mockSave = vi.fn();
const mockComparePassword = vi.fn();
const mockFindOne = vi.fn();
const mockFindById = vi.fn();
const mockGenerateToken = vi.fn(() => "test-jwt");

vi.mock("@utils/auth", () => ({
  generateToken: (...args: unknown[]) => mockGenerateToken(...(args as [])),
  authenticateToken: (req: express.Request, _res: express.Response, next: () => void) => {
    req.userId = "user-507f1f77bcf86cd799439011";
    next();
  },
}));

vi.mock("@models/User", () => {
  function User(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data);
    this._id = "507f1f77bcf86cd799439011";
    this.role = "user";
    this.save = mockSave;
    this.comparePassword = mockComparePassword;
  }
  User.findOne = (...args: unknown[]) => mockFindOne(...args);
  User.findById = (...args: unknown[]) => mockFindById(...args);
  return { default: User };
});

import authRouter from "./auth";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(authRouter);
  return app;
}

describe("auth routes (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockReset();
    mockSave.mockResolvedValue(undefined);
    mockComparePassword.mockReset();
  });

  it("POST /register rejects duplicate email", async () => {
    mockFindOne.mockResolvedValue({ email: "taken@example.com" });
    const res = await request(buildApp()).post("/register").send({
      username: "newuser",
      email: "taken@example.com",
      password: "password123",
    });
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.error).toBe(ERROR_MESSAGES.USER_ALREADY_EXISTS);
  });

  it("POST /register creates user and returns token", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(buildApp()).post("/register").send({
      username: "newuser",
      email: "new@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
    });
    expect(res.status).toBe(HTTP_STATUS.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe("test-jwt");
    expect(res.body.message).toBe(SUCCESS_MESSAGES.REGISTRATION_SUCCESS);
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it("POST /login rejects unknown email", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(buildApp()).post("/login").send({ email: "missing@example.com", password: "x" });
    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.error).toBe(ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD);
  });

  it("POST /login rejects invalid password", async () => {
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      email: "user@example.com",
      comparePassword: mockComparePassword,
      save: mockSave,
    });
    mockComparePassword.mockResolvedValue(false);
    const res = await request(buildApp()).post("/login").send({ email: "user@example.com", password: "wrong" });
    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("POST /login returns token when credentials valid", async () => {
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      username: "user",
      email: "user@example.com",
      firstName: "U",
      lastName: "Ser",
      role: "user",
      comparePassword: mockComparePassword,
      save: mockSave,
    });
    mockComparePassword.mockResolvedValue(true);
    const res = await request(buildApp()).post("/login").send({ email: "user@example.com", password: "secret" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe("test-jwt");
    expect(res.body.message).toBe(SUCCESS_MESSAGES.LOGIN_SUCCESS);
  });

  it("GET /me returns profile for authenticated user", async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011", email: "user@example.com" }),
    });
    const res = await request(buildApp()).get("/me");
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("user@example.com");
  });

  it("GET /me returns 404 when user missing", async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });
    const res = await request(buildApp()).get("/me");
    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(res.body.error).toBe(ERROR_MESSAGES.USER_NOT_FOUND);
  });

  it("PUT /me updates profile fields", async () => {
    const userDoc = {
      firstName: "Old",
      lastName: "Name",
      bio: "",
      avatar: "",
      save: mockSave,
    };
    mockFindById.mockResolvedValue(userDoc);
    const res = await request(buildApp()).put("/me").send({ firstName: "New", bio: "About me" });
    expect(res.status).toBe(200);
    expect(userDoc.firstName).toBe("New");
    expect(userDoc.bio).toBe("About me");
    expect(res.body.message).toBe(SUCCESS_MESSAGES.PROFILE_UPDATED);
  });

  it("PUT /change-password rejects wrong current password", async () => {
    mockFindById.mockResolvedValue({
      comparePassword: mockComparePassword,
      save: mockSave,
    });
    mockComparePassword.mockResolvedValue(false);
    const res = await request(buildApp())
      .put("/change-password")
      .send({ currentPassword: "old", newPassword: "newpassword1" });
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.error).toBe(ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT);
  });

  it("POST /register returns 500 when save fails", async () => {
    mockFindOne.mockResolvedValue(null);
    mockSave.mockRejectedValue(new Error("db down"));
    const res = await request(buildApp()).post("/register").send({
      username: "newuser",
      email: "new2@example.com",
      password: "password123",
    });
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.body.error).toBe(ERROR_MESSAGES.REGISTRATION_FAILED);
  });

  it("POST /login returns 500 when save fails after valid password", async () => {
    mockFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      comparePassword: mockComparePassword,
      save: mockSave,
    });
    mockComparePassword.mockResolvedValue(true);
    mockSave.mockRejectedValue(new Error("db down"));
    const res = await request(buildApp()).post("/login").send({ email: "user@example.com", password: "secret" });
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.body.error).toBe(ERROR_MESSAGES.LOGIN_FAILED);
  });

  it("PUT /me returns 404 when user missing", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await request(buildApp()).put("/me").send({ firstName: "X" });
    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it("PUT /change-password updates password when current is valid", async () => {
    const userDoc = { password: "old", comparePassword: mockComparePassword, save: mockSave };
    mockFindById.mockResolvedValue(userDoc);
    mockComparePassword.mockResolvedValue(true);
    const res = await request(buildApp())
      .put("/change-password")
      .send({ currentPassword: "old", newPassword: "newpassword1" });
    expect(res.status).toBe(200);
    expect(userDoc.password).toBe("newpassword1");
    expect(res.body.message).toBe(SUCCESS_MESSAGES.PASSWORD_CHANGED);
  });

  it("GET /me returns 500 when lookup throws", async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error("db down")),
    });
    const res = await request(buildApp()).get("/me");
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.body.error).toBe(ERROR_MESSAGES.FAILED_TO_GET_PROFILE);
  });

  it("PUT /me returns 500 when save throws", async () => {
    mockFindById.mockResolvedValue({
      firstName: "A",
      lastName: "B",
      bio: "",
      avatar: "",
      save: mockSave,
    });
    mockSave.mockRejectedValue(new Error("db down"));
    const res = await request(buildApp()).put("/me").send({ firstName: "Z" });
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.body.error).toBe(ERROR_MESSAGES.FAILED_TO_UPDATE_PROFILE);
  });

  it("PUT /change-password returns 404 when user missing", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await request(buildApp())
      .put("/change-password")
      .send({ currentPassword: "old", newPassword: "newpassword1" });
    expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it("PUT /change-password returns 500 when save throws", async () => {
    mockFindById.mockResolvedValue({
      comparePassword: mockComparePassword,
      save: mockSave,
    });
    mockComparePassword.mockResolvedValue(true);
    mockSave.mockRejectedValue(new Error("db down"));
    const res = await request(buildApp())
      .put("/change-password")
      .send({ currentPassword: "old", newPassword: "newpassword1" });
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(res.body.error).toBe(ERROR_MESSAGES.FAILED_TO_CHANGE_PASSWORD);
  });
});
