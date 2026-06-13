"use client";

import { useEffect, useRef, useState } from "react";

import type { LazyImageProps } from "@types";

import Skeleton from "@components/common/Skeleton";

const DEFAULT_ROOT_MARGIN = "48px";

/** Image that loads only when visible (IntersectionObserver) with skeleton placeholder until loaded. */
export default function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  skeletonClassName = "absolute inset-0",
  onImageError,
  showSkeleton = true,
  viewportLazy = true,
  rootMargin = DEFAULT_ROOT_MARGIN,
  ...imgProps
}: LazyImageProps) {
  const isInstant = src.startsWith("data:");
  const shouldDefer = viewportLazy && !isInstant;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(!shouldDefer);
  const [loaded, setLoaded] = useState(isInstant);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(isInstant);
    setError(false);
    setIsInView(!shouldDefer);
  }, [src, isInstant, shouldDefer]);

  useEffect(() => {
    if (!shouldDefer) return;

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldDefer, rootMargin, src]);

  if (!src) return null;

  const showImage = isInView && !error;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${containerClassName}`}>
      {showSkeleton && (!loaded || !showImage) && !error && <Skeleton className={skeletonClassName} aria-hidden />}
      {showImage && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            onImageError?.();
          }}
          {...imgProps}
        />
      )}
    </div>
  );
}
