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

describe("apiClient.createPost (axios mocked)", () => {
  beforeEach(() => {
    successInterceptor = null;
    mockAxiosRequest.mockReset();
    vi.resetModules();
  });

  it("POSTs draft payload to /posts", async () => {
    mockAxiosRequest.mockImplementation(async (config: AxiosConfig) => {
      const envelope = {
        success: true,
        data: { _id: "p1", title: "Draft", status: "draft" },
      };
      if (!successInterceptor) {
        throw new Error("response interceptor not registered");
      }
      return successInterceptor({ data: envelope, config });
    });

    const { apiClient } = await import("./apiClient");
    const result = await apiClient.createPost({
      title: "Draft",
      content_markdown: "## Hi",
      status: "draft",
    });
    expect(result.success).toBe(true);
    expect(result.data?._id).toBe("p1");
    const call = mockAxiosRequest.mock.calls[0]?.[0] as AxiosConfig;
    expect(String(call.url)).toMatch(/\/posts$/);
    expect(String(call.method).toUpperCase()).toBe("POST");
  });
});
