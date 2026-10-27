import { beforeEach, describe, expect, it, vi } from "vitest";

type AxiosConfig = { url?: string; method?: string; data?: unknown };

let successInterceptor: ((response: { data: unknown; config: AxiosConfig }) => unknown) | null = null;
const mockAxiosRequest = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      request: mockAxiosRequest,
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: (onFulfilled: (response: { data: unknown; config: AxiosConfig }) => unknown) => {
            successInterceptor = onFulfilled;
          },
        },
      },
    }),
  },
}));

describe("apiClient (axios mocked at boundary)", () => {
  beforeEach(() => {
    successInterceptor = null;
    mockAxiosRequest.mockReset();
    vi.resetModules();
  });

  it("login posts credentials to /auth/login envelope", async () => {
    mockAxiosRequest.mockImplementation(async (config: AxiosConfig) => {
      const envelope = {
        success: true,
        data: { token: "t", user: { email: "a@b.com" } },
      };
      if (!successInterceptor) {
        throw new Error("response interceptor not registered");
      }
      return successInterceptor({ data: envelope, config });
    });

    const { apiClient } = await import("./apiClient");
    const result = await apiClient.login({ email: "a@b.com", password: "secret" });
    expect(result.success).toBe(true);
    expect(result.data?.token).toBe("t");
    expect(mockAxiosRequest).toHaveBeenCalled();
    const call = mockAxiosRequest.mock.calls[0]?.[0] as AxiosConfig;
    expect(String(call.url)).toContain("/auth/login");
    expect(String(call.method).toUpperCase()).toBe("POST");
  });
});
