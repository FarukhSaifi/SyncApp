"use client";

import { useEffect, type ReactNode } from "react";

import { ROUTES } from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

import { INFO_MESSAGES } from "@constants/messages";

import LoadingScreen from "@components/common/LoadingScreen";

/**
 * Auth screens (login/register) render immediately so the form can SSR and E2E
 * can target data-testid without waiting on ClientOnly + token bootstrap.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthForm = pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;

  useEffect(() => {
    if (loading) {
      return;
    }
    if (isAuthenticated && isAuthForm) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, loading, isAuthForm, router]);

  if (loading && !isAuthForm) {
    return <LoadingScreen message={INFO_MESSAGES.LOADING} />;
  }

  return <>{children}</>;
}
