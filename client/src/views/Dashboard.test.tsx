import React from "react";


import { DATA_TABLE } from "@constants";
import { FILTER_STATUS_ALL, FILTER_STATUS_SCHEDULED, POST_STATUS, SYNC_LABEL, TEST_IDS } from "@constants";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Post } from "@types";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Dashboard from "./Dashboard";

const toast = {
  apiError: vi.fn(),
  apiSuccess: vi.fn(),
  deleteSuccess: vi.fn(),
};

vi.mock("@utils/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@utils/apiClient")>();
  return {
    ...mod,
    apiClient: {
      ...mod.apiClient,
      deletePost: vi.fn(),
    },
  };
});

vi.mock("@hooks/useToast", () => ({
  useToast: () => toast,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const samplePost: Post = {
  _id: "post-1",
  title: "Dashboard Post",
  content_markdown: "Body",
  status: POST_STATUS.DRAFT,
  tags: [],
  author: "user-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders stats and post list", async () => {
    const onRefresh = vi.fn();
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        stats={{ total: 1, published: 0, drafts: 1, scheduled: 0, withPlatforms: 0 }}
        onPostDelete={vi.fn()}
        onRefresh={onRefresh}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId(TEST_IDS.DASHBOARD_NEW_POST)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.POST_ROW)).toHaveAttribute("data-post-title", "Dashboard Post");

    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.REFRESH, "i") }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("surfaces load errors via toast", () => {
    render(
      <Dashboard
        posts={[]}
        loading={false}
        error="network"
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(toast.apiError).toHaveBeenCalled();
  });

  it("forwards search and status filter changes", async () => {
    const onSearchChange = vi.fn();
    const onStatusFilterChange = vi.fn();
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
      />,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByPlaceholderText(SYNC_LABEL.DATA_TABLE_SEARCH_POSTS), "dash");
    await act(async () => {
      vi.advanceTimersByTime(DATA_TABLE.SEARCH_DEBOUNCE_MS + 20);
    });
    expect(onSearchChange).toHaveBeenCalled();
    await userEvent.click(screen.getByText(SYNC_LABEL.PUBLISHED));
    expect(onStatusFilterChange).toHaveBeenCalledWith(POST_STATUS.PUBLISHED);
  });

  it("shows initial loading skeleton when posts empty", () => {
    const { container } = render(
      <Dashboard
        posts={[]}
        loading
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("clears active status filter from header link", async () => {
    const onStatusFilterChange = vi.fn();
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
        onStatusFilterChange={onStatusFilterChange}
      />,
    );
    await userEvent.click(screen.getByText(SYNC_LABEL.DRAFTS));
    expect(onStatusFilterChange).toHaveBeenCalledWith(POST_STATUS.DRAFT);
    await userEvent.click(screen.getByText(SYNC_LABEL.CLEAR_FILTER));
    expect(onStatusFilterChange).toHaveBeenCalledWith(FILTER_STATUS_ALL);
  });

  it("filters scheduled via stats card", async () => {
    const onStatusFilterChange = vi.fn();
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
        onStatusFilterChange={onStatusFilterChange}
      />,
    );
    await userEvent.click(screen.getByText(SYNC_LABEL.SCHEDULED));
    expect(onStatusFilterChange).toHaveBeenCalledWith(FILTER_STATUS_SCHEDULED);
  });

  it("surfaces delete API failure via toast", async () => {
    vi.mocked(apiClient.deletePost).mockResolvedValue({ success: false, error: "denied" });
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DELETE }));
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL.DELETE })[1]);
    await waitFor(() => {
      expect(toast.apiError).toHaveBeenCalledWith("denied");
    });
  });

  it("confirms delete and notifies parent on success", async () => {
    const onPostDelete = vi.fn();
    vi.mocked(apiClient.deletePost).mockResolvedValue({ success: true });
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={onPostDelete}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DELETE }));
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL.DELETE })[1]);
    await waitFor(() => {
      expect(onPostDelete).toHaveBeenCalledWith("post-1");
    });
    expect(toast.deleteSuccess).toHaveBeenCalled();
  });

  it("sorts posts, changes page size, and paginates", async () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const secondPost: Post = {
      ...samplePost,
      _id: "post-2",
      title: "Alpha Post",
      seo_score: 40,
      createdAt: "2023-06-01T00:00:00.000Z",
      updatedAt: "2023-07-01T00:00:00.000Z",
    };
    render(
      <Dashboard
        posts={[samplePost, secondPost]}
        loading={false}
        error={null}
        page={2}
        pages={3}
        pageSize={10}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_SORT_ARIA(SYNC_LABEL.TABLE_SEO) }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_SORT_ARIA(SYNC_LABEL.TABLE_CREATED) }),
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_PREV_PAGE_ARIA }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    await userEvent.selectOptions(screen.getByLabelText(SYNC_LABEL.DATA_TABLE_PAGE_SIZE_ARIA), "20");
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it("surfaces delete network errors via toast", async () => {
    vi.mocked(apiClient.deletePost).mockRejectedValue(new Error("network down"));
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DELETE }));
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL.DELETE })[1]);
    await waitFor(() => {
      expect(toast.apiError).toHaveBeenCalledWith(expect.stringContaining("network down"));
    });
  });

  it("closes delete confirmation without removing post", async () => {
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DELETE }));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.CANCEL }));
    expect(apiClient.deletePost).not.toHaveBeenCalled();
  });

  it("retries load from inline error banner", async () => {
    const onRefresh = vi.fn();
    render(
      <Dashboard
        posts={[]}
        loading={false}
        error="timeout"
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={onRefresh}
        onPageChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.RETRY }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("filters published posts from stats card", async () => {
    const onStatusFilterChange = vi.fn();
    render(
      <Dashboard
        posts={[samplePost]}
        loading={false}
        error={null}
        page={1}
        pages={1}
        onPostDelete={vi.fn()}
        onRefresh={vi.fn()}
        onPageChange={vi.fn()}
        onStatusFilterChange={onStatusFilterChange}
      />,
    );
    await userEvent.click(screen.getByText(SYNC_LABEL.PUBLISHED));
    expect(onStatusFilterChange).toHaveBeenCalledWith(POST_STATUS.PUBLISHED);
  });
});
