import { STORAGE_KEYS, THEME_VALUES } from "@constants";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";


import { ThemeProvider, useTheme } from "./ThemeContext";

function ThemeToggleProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

describe("ThemeProvider", () => {
  it("toggles theme and persists to localStorage", async () => {
    localStorage.removeItem(STORAGE_KEYS.THEME);
    render(
      <ThemeProvider>
        <ThemeToggleProbe />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent(THEME_VALUES.LIGHT);

    await userEvent.click(button);
    expect(button).toHaveTextContent(THEME_VALUES.DARK);
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe(THEME_VALUES.DARK);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
