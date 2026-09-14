"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { LazyImageProps } from "@types";

import Skeleton from "@components/common/Skeleton";

/**
 * Wrapper around next/image that provides a skeleton loader and error handling.
 * Automatically chooses between explicit dimensions (width/height) and fill layout
 * to ensure next/image never receives both `fill` and `width`/`height`.
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = "",
  containerClassName = "",
  skeletonClassName = "absolute inset-0",
  onImageError,
  showSkeleton = true,
  viewportLazy: _viewportLazy,
  rootMargin: _rootMargin,
  fill,
  ...restProps
}: LazyImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  if (!src) return null;

  const isDataUri = src.startsWith("data:");
  const showImage = !error;

  const numericWidth = typeof width === "number" ? width : Number(width);
  const numericHeight = typeof height === "number" ? height : Number(height);
  const hasDimensions = !fill && !isNaN(numericWidth) && !isNaN(numericHeight) && numericWidth > 0 && numericHeight > 0;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {showSkeleton && !loaded && !isDataUri && !error && <Skeleton className={skeletonClassName} aria-hidden />}
      {showImage &&
        (hasDimensions ? (
          <Image
            src={src}
            alt={alt || "Image"}
            width={numericWidth}
            height={numericHeight}
            className={`object-cover ${className} transition-opacity duration-300 ${
              loaded || isDataUri ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              onImageError?.();
            }}
            {...(restProps as any)}
          />
        ) : (
          <Image
            src={src}
            alt={alt || "Image"}
            fill
            className={`object-cover ${className} transition-opacity duration-300 ${
              loaded || isDataUri ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              onImageError?.();
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            {...(restProps as any)}
          />
        ))}
    </div>
  );
}
