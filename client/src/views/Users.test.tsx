import React from "react";

import { APP_CONFIG, SYNC_LABEL, TOAST_TITLES, USER_ROLES, USER_VERIFIED_FILTER } from "@constants";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usersToast = {
  apiError: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  validationError: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => usersToast,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import Users from "./Users";

describe("Users admin view", () => {
  beforeEach(() => {
    vi.spyOn(apiClient, "createUser").mockResolvedValue({
      success: true,
      data: { _id: "new", username: "newbie", email: "newbie@test.com", role: "user" },
    });
    vi.spyOn(apiClient, "updateUser").mockResolvedValue({ success: true, message: "updated" });
    vi.spyOn(apiClient, "deleteUser").mockResolvedValue({ success: true, message: "deleted" });
    vi.spyOn(apiClient, "getUsers").mockResolvedValue({
      success: true,
      data: [
        {
          _id: "u1",
          username: "jane",
          email: "jane@test.com",
          firstName: "Jane",
          lastName: "D",
          role: "user",
          isVerified: true,
        },
      ],
      pagination: { page: 1, limit: 5, total: 1, pages: 1 },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads users and shows management header", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalled();
    });
    expect(screen.getByText(SYNC_LABEL.USER_MANAGEMENT_TITLE)).toBeInTheDocument();
  });

  it("refetches when refresh is clicked", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalled();
    });
    const refreshButtons = screen.queryAllByRole("button", { name: new RegExp(SYNC_LABEL.REFRESH, "i") });
    expect(refreshButtons[0]).toBeDefined();
    await userEvent.click(refreshButtons[0]);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalled();
    });
  });

  it("creates user from add modal", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.USER_MANAGEMENT_TITLE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.ADD_USER, "i") }));
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_USERNAME), "newbie");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_EMAIL), "newbie@test.com");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_PASSWORD), "password12345");
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.CREATE_USER }));
    await waitFor(() => {
      expect(apiClient.createUser).toHaveBeenCalled();
      expect(usersToast.success).toHaveBeenCalled();
    });
  });

  it("opens add user modal", async () => {
    const user = userEvent.setup();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.USER_MANAGEMENT_TITLE)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.ADD_USER, "i") }));
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.ADD_NEW_USER)).toBeInTheDocument();
    });
  });

  it("keeps create disabled until username and email provided", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.USER_MANAGEMENT_TITLE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.ADD_USER, "i") }));
    expect(screen.getByRole("button", { name: SYNC_LABEL.CREATE_USER })).toBeDisabled();
    expect(apiClient.createUser).not.toHaveBeenCalled();
  });

  it("updates user role from edit modal", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.EDIT));
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.EDIT_USER)).toBeInTheDocument();
    });
    const roleSelect = document.getElementById("edit-user-role") as HTMLSelectElement;
    await userEvent.selectOptions(roleSelect, USER_ROLES.ADMIN);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.SAVE_CHANGES }));
    await waitFor(() => {
      expect(apiClient.updateUser).toHaveBeenCalledWith("u1", expect.objectContaining({ role: USER_ROLES.ADMIN }));
      expect(usersToast.success).toHaveBeenCalledWith(TOAST_TITLES.USER_UPDATED, "updated");
    });
  });

  it("deletes user after confirmation", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.DELETE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.DELETE));
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.DELETE_USER)).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button", { name: SYNC_LABEL.DELETE });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => {
      expect(apiClient.deleteUser).toHaveBeenCalledWith("u1");
      expect(usersToast.success).toHaveBeenCalledWith(TOAST_TITLES.USER_DELETED, "deleted");
    });
  });

  it("surfaces delete failure via toast", async () => {
    vi.mocked(apiClient.deleteUser).mockResolvedValueOnce({ success: false, error: "forbidden" });
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.DELETE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.DELETE));
    const deleteButtons = screen.getAllByRole("button", { name: SYNC_LABEL.DELETE });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("forbidden");
    });
  });

  it("refetches with search and role filters", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Users />);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalled();
    });
    vi.mocked(apiClient.getUsers).mockClear();
    await user.type(screen.getByLabelText(SYNC_LABEL.PLACEHOLDER_SEARCH_USERS), "jane");
    await act(async () => {
      vi.advanceTimersByTime(APP_CONFIG.SEARCH_DEBOUNCE_MS + 20);
    });
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalledWith(expect.objectContaining({ search: "jane" }));
    });
    await user.selectOptions(screen.getByLabelText(SYNC_LABEL.TABLE_ROLE), USER_ROLES.ADMIN);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalledWith(expect.objectContaining({ role: USER_ROLES.ADMIN }));
    });
    vi.useRealTimers();
  });

  it("shows filter chips and clears role filter", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalled();
    });
    await userEvent.selectOptions(screen.getByLabelText(SYNC_LABEL.TABLE_ROLE), USER_ROLES.ADMIN);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.CLEAR_ALL_FILTERS, "i") })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.CLEAR_ALL_FILTERS, "i") }));
    expect(screen.getByLabelText(SYNC_LABEL.TABLE_ROLE)).toHaveValue("");
  });

  it("surfaces update failure via toast", async () => {
    vi.mocked(apiClient.updateUser).mockResolvedValueOnce({ success: false, error: "cannot update" });
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.EDIT));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.SAVE_CHANGES }));
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("cannot update");
    });
  });

  it("shows load error banner when getUsers fails", async () => {
    vi.mocked(apiClient.getUsers).mockResolvedValue({ success: false, error: "load failed" });
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText("load failed")).toBeInTheDocument();
    });
  });

  it("filters unverified users to empty results", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.selectOptions(screen.getByLabelText(SYNC_LABEL.TABLE_STATUS), USER_VERIFIED_FILTER.UNVERIFIED);
    await waitFor(() => {
      expect(screen.getAllByText(SYNC_LABEL.NO_USERS_FOUND).length).toBeGreaterThan(0);
    });
  });

  it("changes page size and requests the next page", async () => {
    vi.mocked(apiClient.getUsers).mockImplementation(async (params?: Record<string, unknown>) => {
      const page = typeof params?.page === "number" ? params.page : 1;
      const limit = typeof params?.limit === "number" ? params.limit : 5;
      return {
        success: true,
        data: [
          {
            _id: "u1",
            username: "jane",
            email: "jane@test.com",
            firstName: "Jane",
            lastName: "D",
            role: "user",
            isVerified: true,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        pagination: { page, limit, total: 2, pages: 2 },
      };
    });
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_NEXT_PAGE_ARIA }));
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
    await userEvent.selectOptions(screen.getByLabelText(SYNC_LABEL.DATA_TABLE_PAGE_SIZE_ARIA), "20");
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
    });
  });

  it("sorts users by email column", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_SORT_ARIA(SYNC_LABEL.TABLE_EMAIL) }),
    );
  });

  it("creates user with extended profile fields", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.USER_MANAGEMENT_TITLE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.ADD_USER, "i") }));
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_USERNAME), "fulluser");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_EMAIL), "full@test.com");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_FIRST_NAME), "Full");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_LAST_NAME), "User");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_BIO), "Bio text");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_AVATAR_URL), "https://cdn.example/a.png");
    await userEvent.selectOptions(document.getElementById("add-user-role") as HTMLSelectElement, USER_ROLES.ADMIN);
    await userEvent.click(screen.getByRole("checkbox", { name: SYNC_LABEL.LABEL_VERIFIED }));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.CREATE_USER }));
    await waitFor(() => {
      expect(apiClient.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "fulluser",
          email: "full@test.com",
          firstName: "Full",
          lastName: "User",
          bio: "Bio text",
          avatar: "https://cdn.example/a.png",
          role: USER_ROLES.ADMIN,
          isVerified: true,
        }),
      );
    });
  });

  it("surfaces create failure and network errors", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText(SYNC_LABEL.USER_MANAGEMENT_TITLE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.ADD_USER, "i") }));
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_USERNAME), "failuser");
    await userEvent.type(screen.getByPlaceholderText(SYNC_LABEL.PLACEHOLDER_EMAIL), "fail@test.com");
    vi.mocked(apiClient.createUser).mockResolvedValueOnce({ success: false, error: "duplicate" });
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.CREATE_USER }));
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("duplicate");
    });
    vi.mocked(apiClient.createUser).mockRejectedValueOnce(new Error("create down"));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.CREATE_USER }));
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("create down");
    });
  });

  it("toggles verified on edit and cancels edit modal", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.EDIT));
    await userEvent.click(screen.getByRole("checkbox", { name: SYNC_LABEL.LABEL_VERIFIED }));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.CANCEL }));
    expect(screen.queryByText(SYNC_LABEL.EDIT_USER)).not.toBeInTheDocument();
  });

  it("surfaces fetch network error via toast", async () => {
    vi.mocked(apiClient.getUsers).mockRejectedValueOnce(new Error("fetch failed"));
    render(<Users />);
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("fetch failed");
    });
  });

  it("retries from empty state when no filters are active", async () => {
    vi.mocked(apiClient.getUsers).mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 5, total: 0, pages: 1 },
    });
    render(<Users />);
    await waitFor(() => {
      expect(screen.getAllByText(SYNC_LABEL.NO_USERS_FOUND).length).toBeGreaterThan(0);
    });
    vi.mocked(apiClient.getUsers).mockClear();
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL.RETRY })[0]);
    await waitFor(() => {
      expect(apiClient.getUsers).toHaveBeenCalled();
    });
  });

  it("surfaces update network error via toast", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EDIT)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.EDIT));
    vi.mocked(apiClient.updateUser).mockRejectedValueOnce(new Error("update down"));
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.SAVE_CHANGES }));
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("update down");
    });
  });

  it("surfaces delete network error via toast", async () => {
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.DELETE)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText(SYNC_LABEL.DELETE));
    vi.mocked(apiClient.deleteUser).mockRejectedValueOnce(new Error("delete down"));
    const deleteButtons = screen.getAllByRole("button", { name: SYNC_LABEL.DELETE });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => {
      expect(usersToast.apiError).toHaveBeenCalledWith("delete down");
    });
  });
});
