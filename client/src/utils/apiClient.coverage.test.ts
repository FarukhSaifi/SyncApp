import { ERROR_MESSAGES, MDX_DOWNLOAD } from "@constants";
import { beforeEach, describe, expect, it, vi } from "vitest";


type AxiosConfig = { url?: string; method?: string; data?: unknown; headers?: Record<string, string> };

let successInterceptor: ((response: { data: unknown; config: AxiosConfig }) => unknown) | null = null;
let errorInterceptor: ((error: unknown) => unknown) | null = null;
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
          use: (
            onFulfilled: (response: { data: unknown; config: AxiosConfig }) => unknown,
            onRejected: (error: unknown) => unknown,
          ) => {
            successInterceptor = onFulfilled;
            errorInterceptor = onRejected;
          },
        },
      },
    }),
  },
}));

function mockEnvelope(data: unknown, config: AxiosConfig): unknown {
  if (!successInterceptor) {
    throw new Error("response interceptor missing");
  }
  return successInterceptor({ data, config });
}

describe("apiClient coverage (axios mocked)", () => {
  beforeEach(() => {
    successInterceptor = null;
    errorInterceptor = null;
    requestInterceptor = null;
    mockAxiosRequest.mockReset();
    localStorage.clear();
    vi.resetModules();
  });

  function stubSuccess(data: unknown = { success: true, data: {} }): void {
    mockAxiosRequest.mockImplementation(async (config: AxiosConfig) => mockEnvelope(data, config));
  }

  async function loadClient() {
    const mod = await import("./apiClient");
    return mod.apiClient;
  }

  it("covers auth and user endpoints", async () => {
    stubSuccess();
    const client = await loadClient();
    await client.register({ email: "a@b.com" });
    await client.updateProfile({ firstName: "A" });
    await client.changePassword({ currentPassword: "a", newPassword: "b" });
    await client.getUser("u1");
    await client.getUsers({ page: 1 });
    await client.createUser({ email: "x@y.com" });
    await client.updateUser("u1", { role: "user" });
    await client.deleteUser("u1");
    expect(mockAxiosRequest.mock.calls.length).toBeGreaterThan(6);
  });

  it("covers posts, credentials, publish, analytics, and AI endpoints", async () => {
    stubSuccess();
    const client = await loadClient();
    await client.getPost("p1");
    await client.getPostBySlug("slug");
    await client.updatePost("p1", { title: "T" });
    await client.deletePost("p1");
    await client.upsertCredential("devto", { token: "t" });
    await client.deleteCredential("devto");
    await client.publish("devto", "p1");
    await client.publishAll("p1");
    await client.unpublishFromPlatform("devto", "p1");
    await client.linkedinOAuthStart();
    await client.getAnalyticsStats();
    await client.getAnalyticsEngagement();
    await client.refreshAnalyticsEngagement();
    await client.getAnalyticsWebsite({ startDate: "2024-01-01", endDate: "2024-01-31" });
    await client.aiGenerate("keyword");
    await client.aiKeywordResearch("seed");
    await client.aiGenerateImage("topic", "prompt");
    await client.aiGenerateLinkedInSummary({ title: "T", content: "C" });
    await client.aiEdit("shorten", "text");
    await client.aiImproveSeo({ targets: [] });
    await client.aiTrendingTopics(true);
    await client.aiDevtoTags(true);
    await client.uploadPostCover("p1", "data:image/png;base64,abc");
    expect(mockAxiosRequest.mock.calls.length).toBeGreaterThan(15);
  });

  it("uploadImage presigns then PUTs to cloud URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    mockAxiosRequest.mockImplementation(async (config: AxiosConfig) => {
      if (String(config.url).includes("presigned-url")) {
        return mockEnvelope(
          {
            success: true,
            data: {
              presignedUrl: "https://storage.example/upload",
              publicUrl: "https://cdn.example/img.png",
              key: "k",
            },
          },
          config,
        );
      }
      return mockEnvelope({ success: true, data: {} }, config);
    });

    const client = await loadClient();
    const file = new File(["bytes"], "photo.png", { type: "image/png" });
    const result = await client.uploadImage(file);
    expect(result.success).toBe(true);
    expect(result.data?.url).toBe("https://cdn.example/img.png");
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("request interceptor strips Content-Type for FormData", async () => {
    stubSuccess();
    await loadClient();
    expect(requestInterceptor).toBeTruthy();
    const form = new FormData();
    form.append("file", "x");
    const next = requestInterceptor?.({ headers: { "Content-Type": "application/json" }, data: form });
    expect(next?.headers?.["Content-Type"]).toBeUndefined();
  });

  it("response error interceptor maps HTTP and network failures", async () => {
    stubSuccess();
    await loadClient();
    expect(errorInterceptor).toBeTruthy();

    await expect(
      errorInterceptor?.({
        response: { status: 500, statusText: "Err", data: { error: "Server broke" } },
        config: { method: "get", url: "/x" },
      }),
    ).rejects.toThrow("Server broke");

    await expect(
      errorInterceptor?.({
        request: {},
        config: { method: "get", url: "/x" },
      }),
    ).rejects.toThrow(ERROR_MESSAGES.NETWORK_ERROR_UNABLE_TO_CONNECT);

    await expect(
      errorInterceptor?.({
        message: "timeout",
        config: { method: "get", url: "/x" },
      }),
    ).rejects.toThrow("timeout");
  });

  it("downloadMdx throws when response not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);
    const client = await loadClient();
    await expect(client.downloadMdx("missing")).rejects.toThrow(MDX_DOWNLOAD.FAILED_MESSAGE);
  });
});
