"use client";

import { useEffect, useState, type ReactNode } from "react";

import LoadingScreen from "@components/common/LoadingScreen";
import { INFO_MESSAGES } from "@constants/messages";

interface ClientOnlyProps {
  children: ReactNode;
  message?: string;
}

/** Renders children only after mount — prevents hydration mismatches for client-only trees. */
export default function ClientOnly({ children, message = INFO_MESSAGES.LOADING }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <LoadingScreen message={message} />;
  return <>{children}</>;
}
