"use client";

import { useEffect, useState } from "react";

import type { LazyImageProps } from "@types";

import Skeleton from "@components/common/Skeleton";

/** Image with lazy loading, async decode, and skeleton placeholder until loaded. */
export default function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  skeletonClassName = "absolute inset-0",
  onImageError,
  showSkeleton = true,
  ...imgProps
}: LazyImageProps) {
  const isInstant = src.startsWith("data:");
  const [loaded, setLoaded] = useState(isInstant);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(isInstant);
    setError(false);
  }, [src, isInstant]);

  if (!src) return null;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {showSkeleton && !loaded && !error && <Skeleton className={skeletonClassName} aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} transition-opacity duration-300 ${loaded && !error ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          onImageError?.();
        }}
        {...imgProps}
      />
    </div>
  );
}
