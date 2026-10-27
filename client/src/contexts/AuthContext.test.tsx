import React from "react";

import { SYNC_LABEL } from "@constants";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


import { AuthProvider, useAuth } from "./AuthContext";

const toaster = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  authError: vi.fn(),
  networkError: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => toaster,
}));

function Probe() {
  const { login: doLogin, loading, isAuthenticated } = useAuth();
  if (loading) {
    return <div>loading</div>;
  }
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? "in" : "out"}</span>
      <button type="button" data-testid="login-btn" onClick={() => void doLogin("a@b.com", "secret")}>
        sign-in
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  beforeEach(() => {
    localStorage.clear();
    toaster.success.mockReset();
    toaster.authError.mockReset();
  });

  it("logs in and stores token", async () => {
    vi.spyOn(apiClient, "login").mockResolvedValue({
      success: true,
      data: {
        token: "jwt",
        user: { _id: "1", email: "a@b.com", username: "a", firstName: "A", lastName: "B", role: "user" },
      },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("out");
    });

    await userEvent.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("in");
    });
    expect(toaster.success).toHaveBeenCalled();
  });

  it("loads profile when token exists", async () => {
    localStorage.setItem("token", "jwt");
    vi.spyOn(apiClient, "getMe").mockResolvedValue({
      success: true,
      data: { _id: "1", email: "stored@b.com", username: "s", firstName: "S", lastName: "U", role: "user" },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("in");
    });
  });

  it("shows auth error on failed login", async () => {
    vi.spyOn(apiClient, "login").mockResolvedValue({ success: false, error: SYNC_LABEL.INVALID_CREDENTIALS });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("login-btn"));
    expect(toaster.authError).toHaveBeenCalled();
  });
});
