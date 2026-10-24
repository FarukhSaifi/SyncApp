import type { ThemeColors } from "./theme";

export interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  theme: string;
  toggleTheme: () => void;
}
