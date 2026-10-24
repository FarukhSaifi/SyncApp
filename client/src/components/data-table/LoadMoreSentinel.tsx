import { useEffect, useRef } from "react";

import { DATA_TABLE } from "@constants";
import type { LoadMoreSentinelProps } from "@types";

/** IntersectionObserver trigger for infinite-scroll lists. */
export function LoadMoreSentinel({ enabled, onIntersect }: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          onIntersect();
        }
      },
      { root: null, rootMargin: DATA_TABLE.SENTINEL_ROOT_MARGIN, threshold: DATA_TABLE.SENTINEL_THRESHOLD },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [enabled, onIntersect]);

  return <div ref={ref} className={DATA_TABLE.SENTINEL} aria-hidden />;
}
