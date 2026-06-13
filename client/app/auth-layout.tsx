"use client";

import { useEffect, type ReactNode } from "react";

import { ROUTES } from "@constants";
import { useAuth } from "@contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

import { INFO_MESSAGES } from "@constants/messages";

import ClientOnly from "@components/common/ClientOnly";
import LoadingScreen from "@components/common/LoadingScreen";

function AuthLayoutInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER)) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) {
    return <LoadingScreen message={INFO_MESSAGES.LOADING} />;
  }

  return <>{children}</>;
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ClientOnly>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </ClientOnly>
  );
}
