import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, logout: vi.fn(), isAuthenticated: false }),
}));

vi.mock("@contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

import Layout from "./Layout";

describe("Layout unauthenticated", () => {
  it("renders children without app shell chrome", () => {
    render(
      <Layout>
        <div>public child</div>
      </Layout>,
    );
    expect(screen.getByText("public child")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
