import { STORAGE_KEYS, SYNC_LABEL, TOAST_TITLES } from "@constants";
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

vi.mock("@hooks/usePosts", () => ({
  clearPostsCache: vi.fn(),
}));

const userFixture = {
  _id: "1",
  email: "a@b.com",
  username: "alice",
  firstName: "Alice",
  lastName: "B",
  role: "user" as const,
};

function AuthProbe() {
  const auth = useAuth();
  if (auth.loading) {
    return <div>loading</div>;
  }
  return (
    <div>
      <span data-testid="auth-state">{auth.isAuthenticated ? "in" : "out"}</span>
      <button type="button" data-testid="logout-btn" onClick={() => auth.logout()}>
        logout
      </button>
      <button
        type="button"
        data-testid="register-btn"
        onClick={() =>
          void auth.register({
            email: "new@b.com",
            password: "secret",
            username: "new",
            firstName: "N",
            lastName: "U",
          })
        }
      >
        register
      </button>
      <button type="button" data-testid="profile-btn" onClick={() => void auth.updateProfile({ firstName: "Updated" })}>
        profile
      </button>
      <button type="button" data-testid="password-btn" onClick={() => void auth.changePassword("old", "newpass")}>
        password
      </button>
    </div>
  );
}

describe("AuthProvider extended", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  beforeEach(() => {
    localStorage.clear();
    Object.values(toaster).forEach((fn) => fn.mockReset());
  });

  it("throws when useAuth is outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AuthProbe />)).toThrow("useAuth must be used within an AuthProvider");
    consoleError.mockRestore();
  });

  it("logs out and clears token", async () => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "jwt");
    vi.spyOn(apiClient, "getMe").mockResolvedValue({ success: true, data: userFixture });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("in");
    });

    await userEvent.click(screen.getByTestId("logout-btn"));

    expect(screen.getByTestId("auth-state")).toHaveTextContent("out");
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    expect(toaster.info).toHaveBeenCalledWith(TOAST_TITLES.LOGGED_OUT, SYNC_LABEL.LOGGED_OUT_SUCCESS);
  });

  it("registers successfully", async () => {
    vi.spyOn(apiClient, "register").mockResolvedValue({
      success: true,
      data: { token: "jwt", user: userFixture },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("register-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("in");
    });
    expect(toaster.success).toHaveBeenCalled();
  });

  it("handles expired session on profile fetch", async () => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "bad");
    vi.spyOn(apiClient, "getMe").mockResolvedValue({ success: false, error: "expired" });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("out");
    });
    expect(toaster.authError).toHaveBeenCalledWith(SYNC_LABEL.SESSION_EXPIRED);
  });

  it("updates profile and changes password", async () => {
    vi.spyOn(apiClient, "updateProfile").mockResolvedValue({
      success: true,
      data: { ...userFixture, firstName: "Updated" },
    });
    vi.spyOn(apiClient, "changePassword").mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("profile-btn"));
    expect(toaster.success).toHaveBeenCalledWith(TOAST_TITLES.PROFILE_UPDATED, SYNC_LABEL.PROFILE_UPDATED_SUCCESS);

    await userEvent.click(screen.getByTestId("password-btn"));
    expect(toaster.success).toHaveBeenCalledWith(TOAST_TITLES.PASSWORD_CHANGED, SYNC_LABEL.PASSWORD_CHANGED_SUCCESS);
  });

  it("logs out when profile fetch throws", async () => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "jwt");
    vi.spyOn(apiClient, "getMe").mockRejectedValue(new Error("Network Error"));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("out");
    });
    expect(toaster.networkError).toHaveBeenCalled();
  });

  it("maps login network failures to network toast", async () => {
    vi.spyOn(apiClient, "login").mockRejectedValue(new Error("Network Error"));

    function LoginOnly() {
      const { login, loading } = useAuth();
      if (loading) {
        return <div>loading</div>;
      }
      return (
        <button type="button" data-testid="login-btn" onClick={() => void login("a@b.com", "x")}>
          login
        </button>
      );
    }

    render(
      <AuthProvider>
        <LoginOnly />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("login-btn"));
    expect(toaster.networkError).toHaveBeenCalled();
  });
});
