"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@contexts/AuthContext";
import { ThemeProvider } from "@contexts/ThemeContext";

import { ToasterProvider } from "@components/common/Toaster";


export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToasterProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ToasterProvider>
  );
}
