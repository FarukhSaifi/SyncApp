"use client";

import { useEffect, useState } from "react";

import type { LazyImageProps } from "@types";
import Image from "next/image";

import { LAZY_IMAGE } from "@constants/designTokens";

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
  skeletonClassName = LAZY_IMAGE["SKELETON_CLASS"],
  onImageError,
  showSkeleton = true,
  viewportLazy: _viewportLazy,
  rootMargin: _rootMargin,
  fill,
  ...restProps
}: LazyImageProps) {
  const [error, setError] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  if (!src) {
    return null;
  }

  const isDataUri = src.startsWith(LAZY_IMAGE["DATA_URI_PREFIX"]);
  const showImage = !error;

  const numericWidth = typeof width === "number" ? width : Number(width);
  const numericHeight = typeof height === "number" ? height : Number(height);
  const hasDimensions = !fill && !isNaN(numericWidth) && !isNaN(numericHeight) && numericWidth > 0 && numericHeight > 0;
  const resolvedAlt = alt || LAZY_IMAGE["DEFAULT_ALT"];

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {showSkeleton && !loaded && !isDataUri && !error ? <Skeleton className={skeletonClassName} aria-hidden /> : null}
      {showImage ? (
        hasDimensions ? (
          <Image
            src={src}
            alt={resolvedAlt}
            width={numericWidth}
            height={numericHeight}
            className={`object-cover ${className} transition-opacity duration-300 ${
              loaded || isDataUri ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => {
              setLoaded(true);
            }}
            onError={() => {
              setError(true);
              onImageError?.();
            }}
            {...restProps}
          />
        ) : (
          <Image
            src={src}
            alt={resolvedAlt}
            fill
            className={`object-cover ${className} transition-opacity duration-300 ${
              loaded || isDataUri ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => {
              setLoaded(true);
            }}
            onError={() => {
              setError(true);
              onImageError?.();
            }}
            sizes={LAZY_IMAGE["SIZES"]}
            {...restProps}
          />
        )
      ) : null}
    </div>
  );
}
