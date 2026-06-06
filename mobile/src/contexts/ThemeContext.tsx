import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { STORAGE_KEYS } from "@/src/constants/config";
import { darkColors, lightColors, type ThemeColors } from "@/src/constants/palette";
import { THEME_VALUES } from "@/src/constants/theme";

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  theme: string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  theme: THEME_VALUES.LIGHT,
  toggleTheme: () => {},
});

function themeFromScheme(scheme: string | null | undefined): string {
  return scheme === "dark" ? THEME_VALUES.DARK : THEME_VALUES.LIGHT;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(() => themeFromScheme(systemScheme));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (!cancelled && (stored === THEME_VALUES.DARK || stored === THEME_VALUES.LIGHT)) {
          setTheme(stored);
        }
      } catch {
        /* use system-derived initial theme */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistTheme = useCallback(async (next: string) => {
    setTheme(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    void persistTheme(theme === THEME_VALUES.DARK ? THEME_VALUES.LIGHT : THEME_VALUES.DARK);
  }, [persistTheme, theme]);

  const isDark = theme === THEME_VALUES.DARK;

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      theme,
      toggleTheme,
    }),
    [isDark, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}
