import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { STORAGE_KEYS, THEME_VALUES } from "@constants";

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEME_VALUES.LIGHT,
  setTheme: () => {},
  toggleTheme: () => {},
});

function getInitialTheme(): string {
  if (typeof window === "undefined") return THEME_VALUES.LIGHT;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === THEME_VALUES.DARK || stored === THEME_VALUES.LIGHT) return stored;
  } catch {}
  return THEME_VALUES.LIGHT;
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<string>(() => getInitialTheme());

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === THEME_VALUES.DARK) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
    root.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === THEME_VALUES.DARK ? THEME_VALUES.LIGHT : THEME_VALUES.DARK)),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
