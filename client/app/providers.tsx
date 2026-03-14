"use client";

import { ToasterProvider } from "@components/common/Toaster";
import { AuthProvider } from "@contexts/AuthContext";
import { ThemeProvider } from "@contexts/ThemeContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToasterProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ToasterProvider>
  );
}
