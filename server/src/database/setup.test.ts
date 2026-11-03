import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@database/connection", () => ({
  default: vi.fn(async () => undefined),
}));

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongoose")>();
  return {
    default: {
      ...actual.default,
      connection: { readyState: 1, close: vi.fn(async () => undefined) },
    },
  };
});

describe("setupDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connects and closes on success", async () => {
    const setupDatabase = (await import("./setup")).default;
    const connectDB = (await import("@database/connection")).default as ReturnType<typeof vi.fn>;
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

    await setupDatabase();

    expect(connectDB).toHaveBeenCalledOnce();
    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
