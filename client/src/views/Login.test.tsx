import React from "react";

import { ROUTES, SYNC_LABEL, TEST_IDS } from "@constants";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";


import Login from "./Login";

const push = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ login }),
}));

vi.mock("@components/common/AppLogo", () => ({
  default: () => <div data-testid="app-logo" />,
}));

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Login", () => {
  it("sets hydration marker after mount", async () => {
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.LOGIN_FORM)).toHaveAttribute("data-hydrated", "true");
    });
    expect(screen.getByTestId(TEST_IDS.LOGIN_READY)).toBeInTheDocument();
  });

  it("submits credentials and navigates on success", async () => {
    login.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.LOGIN_READY)).toBeInTheDocument();
    });

    await user.type(screen.getByTestId(TEST_IDS.LOGIN_EMAIL), "user@example.com");
    await user.type(screen.getByTestId(TEST_IDS.LOGIN_PASSWORD), "secret");
    await user.click(screen.getByTestId(TEST_IDS.LOGIN_SUBMIT));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("user@example.com", "secret");
      expect(push).toHaveBeenCalledWith(ROUTES.DASHBOARD);
    });
  });

  it("shows API error when login fails", async () => {
    login.mockResolvedValueOnce({ success: false, error: "Invalid credentials" });
    const user = userEvent.setup();
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.LOGIN_READY)).toBeInTheDocument();
    });

    await user.type(screen.getByTestId(TEST_IDS.LOGIN_EMAIL), "user@example.com");
    await user.type(screen.getByTestId(TEST_IDS.LOGIN_PASSWORD), "wrong");
    await user.click(screen.getByTestId(TEST_IDS.LOGIN_SUBMIT));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  it("toggles password visibility and submits on Enter", async () => {
    login.mockResolvedValueOnce({ success: true });
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.LOGIN_READY)).toBeInTheDocument();
    });

    const password = screen.getByTestId(TEST_IDS.LOGIN_PASSWORD);
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Toggle password visibility" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.change(screen.getByTestId(TEST_IDS.LOGIN_EMAIL), { target: { name: "email", value: "a@b.co" } });
    fireEvent.change(password, { target: { name: "password", value: "pw" } });
    fireEvent.keyDown(password, { key: "Enter" });

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });

  it("shows unexpected error when login throws", async () => {
    login.mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    render(<Login />);
    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.LOGIN_READY)).toBeInTheDocument();
    });

    await user.type(screen.getByTestId(TEST_IDS.LOGIN_EMAIL), "user@example.com");
    await user.type(screen.getByTestId(TEST_IDS.LOGIN_PASSWORD), "secret");
    await user.click(screen.getByTestId(TEST_IDS.LOGIN_SUBMIT));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(SYNC_LABEL.UNEXPECTED_ERROR);
    });
  });
});
