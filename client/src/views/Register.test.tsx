import React from "react";

import { SYNC_LABEL } from "@constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";


import Register from "./Register";

const register = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ register }),
}));

vi.mock("@components/common/AppLogo", () => ({
  default: () => <div data-testid="app-logo" />,
}));

describe("Register", () => {
  it("renders sign-up fields", async () => {
    render(<Register />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.EMAIL_LABEL)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(SYNC_LABEL.LABEL_PASSWORD)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.CREATE_ACCOUNT_BUTTON, "i") }).length,
    ).toBeGreaterThan(0);
  });

  it("submits registration and navigates on success", async () => {
    register.mockResolvedValue({ success: true });
    render(<Register />);

    await userEvent.type(screen.getByLabelText(SYNC_LABEL.EMAIL_LABEL), "new@test.com");
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.LABEL_USERNAME), "newuser");
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.LABEL_PASSWORD), "password12345");
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.CONFIRM_NEW_PASSWORD), "password12345");
    await userEvent.click(
      screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.CREATE_ACCOUNT_BUTTON, "i") })[0],
    );

    await waitFor(() => {
      expect(register).toHaveBeenCalled();
      expect(push).toHaveBeenCalled();
    });
  });
});
