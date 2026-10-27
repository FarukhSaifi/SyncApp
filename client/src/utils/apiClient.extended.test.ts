import { beforeEach, describe, expect, it, vi } from "vitest";

type AxiosConfig = { url?: string; method?: string; data?: unknown; headers?: Record<string, string> };

let successInterceptor: ((response: { data: unknown; config: AxiosConfig }) => unknown) | null = null;
let requestInterceptor: ((config: AxiosConfig) => AxiosConfig) | null = null;
const mockAxiosRequest = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      request: mockAxiosRequest,
      interceptors: {
        request: {
          use: (onFulfilled: (config: AxiosConfig) => AxiosConfig) => {
            requestInterceptor = onFulfilled;
          },
        },
        response: {
          use: (onFulfilled: (response: { data: unknown; config: AxiosConfig }) => unknown) => {
            successInterceptor = onFulfilled;
          },
        },
      },
    }),
  },
}));

async function loadClient() {
  const mod = await import("./apiClient");
  return mod.apiClient;
}

function mockEnvelope(data: unknown, config: AxiosConfig) {
  if (!successInterceptor) {
    throw new Error("response interceptor missing");
  }
  return successInterceptor({ data, config });
}

describe("apiClient extended (axios mocked)", () => {
  beforeEach(() => {
    successInterceptor = null;
    requestInterceptor = null;
    mockAxiosRequest.mockReset();
    localStorage.clear();
    vi.resetModules();
  });

  it("getMe GETs /auth/me", async () => {
    mockAxiosRequest.mockImplementation(async (config: AxiosConfig) =>
      mockEnvelope({ success: true, data: { email: "a@b.com" } }, config),
    );
    const apiClient = await loadClient();
    const result = await apiClient.getMe();
    expect(result.success).toBe(true);
    const call = mockAxiosRequest.mock.calls[0]?.[0] as AxiosConfig;
    expect(String(call.url)).toContain("/auth/me");
  });

  it("getPosts passes query params", async () => {
    mockAxiosRequest.mockImplementation(async (config: AxiosConfig) =>
      mockEnvelope({ success: true, data: [], pagination: {} }, config),
    );
    const apiClient = await loadClient();
    await apiClient.getPosts({ page: 1, limit: 5 });
    const call = mockAxiosRequest.mock.calls[0]?.[0] as AxiosConfig;
    expect(String(call.url)).toContain("/posts");
  });

  it("request interceptor attaches bearer token from storage", async () => {
    localStorage.setItem("token", "jwt-123");
    mockAxiosRequest.mockImplementation(async (rawConfig: AxiosConfig) => {
      const config = requestInterceptor ? requestInterceptor(rawConfig) : rawConfig;
      return mockEnvelope({ success: true, data: null }, config);
    });
    const apiClient = await loadClient();
    await apiClient.getMe();
    const call = mockAxiosRequest.mock.calls[0]?.[0] as AxiosConfig;
    const withAuth = requestInterceptor ? requestInterceptor(call) : call;
    expect(withAuth.headers?.Authorization).toBe("Bearer jwt-123");
  });
});
