"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query. Defaults to `false` until mounted (SSR-safe).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(query);
    const sync = () => {
      setMatches(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, [query]);

  return matches;
}
