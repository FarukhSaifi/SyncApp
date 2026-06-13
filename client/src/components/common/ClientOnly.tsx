"use client";

import { useEffect, useState } from "react";

import type { ClientOnlyProps } from "@types";

import { INFO_MESSAGES } from "@constants/messages";

import LoadingScreen from "@components/common/LoadingScreen";

/** Renders children only after mount — prevents hydration mismatches for client-only trees. */
export default function ClientOnly({ children, message = INFO_MESSAGES.LOADING }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <LoadingScreen message={message} />;
  return <>{children}</>;
}
