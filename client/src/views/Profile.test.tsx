import React from "react";

import { SYNC_LABEL } from "@constants";
import { render, screen, waitFor, within } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const updateProfile = vi.fn();
const changePassword = vi.fn();

vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@test.com",
      username: "ada",
      bio: "Math",
      avatar: "",
    },
    updateProfile,
    changePassword,
  }),
}));

const toast = { apiSuccess: vi.fn(), apiError: vi.fn(), success: vi.fn(), error: vi.fn() };

vi.mock("@hooks/useToast", () => ({
  useToast: () => toast,
}));

import Profile from "./Profile";

describe("Profile view", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders profile sections and submits profile update", async () => {
    updateProfile.mockResolvedValue({ success: true });
    render(<Profile />);
    expect(screen.getAllByText(SYNC_LABEL.PROFILE_INFORMATION)[0]).toBeInTheDocument();

    const firstName = screen.getByLabelText(new RegExp(SYNC_LABEL.LABEL_FIRST_NAME, "i"));
    await userEvent.clear(firstName);
    await userEvent.type(firstName, "Grace");

    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.UPDATE_PROFILE, "i") }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalled();
    });
  });

  it("submits password change", async () => {
    changePassword.mockResolvedValue({ success: true });
    render(<Profile />);
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL.CHANGE_PASSWORD })[0]);
    const currentField = screen.getAllByPlaceholderText(SYNC_LABEL.CURRENT_PASSWORD)[0];
    const passwordForm = currentField.closest("form");
    expect(passwordForm).toBeTruthy();
    await userEvent.type(currentField, "old-pass-123");
    await userEvent.type(screen.getAllByPlaceholderText(SYNC_LABEL.NEW_PASSWORD)[0], "new-pass-12345");
    await userEvent.type(screen.getAllByPlaceholderText(SYNC_LABEL.CONFIRM_PASSWORD)[0], "new-pass-12345");
    await userEvent.click(within(passwordForm as HTMLElement).getByRole("button", { name: SYNC_LABEL.CHANGE_PASSWORD }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalled();
    });
  });

  it("switches to password section", async () => {
    render(<Profile />);
    await userEvent.click(screen.getAllByRole("button", { name: SYNC_LABEL.CHANGE_PASSWORD })[0]);
    expect(screen.getByLabelText(new RegExp(SYNC_LABEL.CURRENT_PASSWORD, "i"))).toBeInTheDocument();
  });
});
