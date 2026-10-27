import { beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@constants/messages";

const mockFind = vi.fn();
const mockCountDocuments = vi.fn();
const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockFindByIdAndDelete = vi.fn();
const mockFindOne = vi.fn();
const mockSave = vi.fn();
const mockStartSession = vi.fn();
const mockDeleteManyPost = vi.fn();
const mockDeleteManyCredential = vi.fn();

vi.mock("@models/User", () => {
  function UserModel(this: { save: typeof mockSave; toObject: () => Record<string, unknown> }) {
    this.save = mockSave;
    this.toObject = () => ({
      _id: "u2",
      email: "new@b.com",
      username: "newuser",
      password: "secret",
    });
  }
  UserModel.find = (...args: unknown[]) => mockFind(...args);
  UserModel.countDocuments = (...args: unknown[]) => mockCountDocuments(...args);
  UserModel.findById = (...args: unknown[]) => mockFindById(...args);
  UserModel.findByIdAndUpdate = (...args: unknown[]) => mockFindByIdAndUpdate(...args);
  UserModel.findByIdAndDelete = (...args: unknown[]) => mockFindByIdAndDelete(...args);
  UserModel.findOne = (...args: unknown[]) => mockFindOne(...args);
  return { default: UserModel };
});

vi.mock("@models/Post", () => ({
  default: { deleteMany: (...args: unknown[]) => mockDeleteManyPost(...args) },
}));

vi.mock("@models/Credential", () => ({
  default: { deleteMany: (...args: unknown[]) => mockDeleteManyCredential(...args) },
}));

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongoose")>();
  return {
    default: {
      ...actual.default,
      startSession: (...args: unknown[]) => mockStartSession(...args),
    },
  };
});

import { createUser, deleteUser, getUserById, getUsers, updateUser } from "./usersService";

describe("usersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({ lean: vi.fn(async () => [{ _id: "u1", email: "a@b.com" }]) }),
          }),
        }),
      }),
    });
    mockCountDocuments.mockResolvedValue(1);
    mockSave.mockResolvedValue(undefined);
  });

  it("getUsers returns paginated list", async () => {
    const result = await getUsers({ page: 1, limit: 10, search: "a" });
    expect(result.users).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("getUserById throws when missing", async () => {
    mockFindById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    await expect(getUserById("missing")).rejects.toThrow(ERROR_MESSAGES.USER_NOT_FOUND);
  });

  it("updateUser rejects invalid role", async () => {
    await expect(updateUser("u1", { role: "superadmin" })).rejects.toThrow(ERROR_MESSAGES.INVALID_ROLE);
  });

  it("createUser rejects duplicate email", async () => {
    mockFindOne.mockResolvedValue({ _id: "existing" });
    await expect(
      createUser({
        username: "newuser",
        email: "a@b.com",
        password: "password1",
        firstName: "A",
        lastName: "B",
      }),
    ).rejects.toThrow(ERROR_MESSAGES.USER_ALREADY_EXISTS);
  });

  it("createUser saves and strips password from response", async () => {
    mockFindOne.mockResolvedValue(null);
    const created = await createUser({
      username: "newuser",
      email: "new@b.com",
      password: "password1",
      firstName: "N",
      lastName: "U",
    });
    expect(mockSave).toHaveBeenCalledOnce();
    expect(created.email).toBe("new@b.com");
    expect(created.password).toBeUndefined();
  });

  it("getUserById returns user without password", async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "u1", email: "a@b.com", username: "user" }),
    });
    const user = await getUserById("u1");
    expect(user.email).toBe("a@b.com");
  });

  it("updateUser applies allowed fields", async () => {
    mockFindByIdAndUpdate.mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "u1", email: "a@b.com", role: "admin" }),
    });
    const updated = await updateUser("u1", { firstName: "New", role: "admin" });
    expect(updated.role).toBe("admin");
  });

  it("deleteUser throws when user missing", async () => {
    const session = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    };
    mockStartSession.mockResolvedValue(session);
    mockFindById.mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    });

    await expect(deleteUser("507f1f77bcf86cd799439011")).rejects.toThrow(ERROR_MESSAGES.USER_NOT_FOUND);
    expect(session.abortTransaction).toHaveBeenCalledOnce();
  });

  it("deleteUser runs transactional cleanup", async () => {
    const session = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    };
    mockStartSession.mockResolvedValue(session);
    mockFindById.mockReturnValue({
      session: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
    });
    mockDeleteManyPost.mockResolvedValue({ deletedCount: 2 });
    mockDeleteManyCredential.mockResolvedValue({ deletedCount: 1 });
    mockFindByIdAndDelete.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });

    const result = await deleteUser("507f1f77bcf86cd799439011");
    expect(result.message).toBe(SUCCESS_MESSAGES.USER_DELETED);
    expect(result.deletedPosts).toBe(2);
    expect(session.commitTransaction).toHaveBeenCalledOnce();
  });
});
