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

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const getInitialTheme = (): string => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === THEME_VALUES.DARK || stored === THEME_VALUES.LIGHT) return stored;
    } catch {}
    return THEME_VALUES.LIGHT;
  };

  const [theme, setTheme] = useState<string>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === THEME_VALUES.DARK) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
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
