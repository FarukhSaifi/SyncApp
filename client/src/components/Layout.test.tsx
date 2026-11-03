import React from "react";

import { BUTTON_LABELS, INFO_MESSAGES, PAGE_TITLES, ROUTES, USER_ROLES } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => ROUTES.DASHBOARD,
  useRouter: () => ({ push }),
}));

vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { role: USER_ROLES.ADMIN, firstName: "A", username: "admin" },
    logout,
    isAuthenticated: true,
  }),
}));

vi.mock("@contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("@components/common/AppLogo", () => ({
  default: () => <div data-testid="app-logo" />,
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

import Layout from "./Layout";

describe("Layout", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nav links and children", () => {
    render(
      <Layout>
        <div>child content</div>
      </Layout>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.getByText(PAGE_TITLES.DASHBOARD)).toBeInTheDocument();
    expect(screen.getByText(PAGE_TITLES.USERS)).toBeInTheDocument();
  });

  it("logout redirects to login", async () => {
    render(
      <Layout>
        <div>child</div>
      </Layout>,
    );
    await userEvent.click(screen.getAllByRole("button", { name: BUTTON_LABELS.SIGN_OUT })[0]);
    expect(logout).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  it("opens and closes mobile navigation drawer", async () => {
    render(
      <Layout>
        <div>child content</div>
      </Layout>,
    );
    await userEvent.click(screen.getByRole("button", { name: INFO_MESSAGES.OPEN_MOBILE_MENU_ARIA }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: INFO_MESSAGES.CLOSE_MOBILE_MENU_ARIA })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows admin users link for admin role", () => {
    render(
      <Layout>
        <div>child</div>
      </Layout>,
    );
    expect(screen.getAllByText(PAGE_TITLES.USERS).length).toBeGreaterThan(0);
  });
});
