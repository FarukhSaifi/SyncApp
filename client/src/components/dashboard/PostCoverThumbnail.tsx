"use client";

import { useEffect, useState } from "react";

import { POST_COVER_THUMB } from "@constants";
import type { PostCoverPlaceholderProps, PostCoverThumbnailProps } from "@types";
import { FiImage } from "react-icons/fi";

import { SYNC_LABEL } from "@constants/messages";

import LazyImage from "@components/common/LazyImage";

/** Placeholder when cover src is missing or failed to load. */
function CoverPlaceholder({ size }: PostCoverPlaceholderProps) {
  const { container } = POST_COVER_THUMB[size];
  return (
    <div
      className={`${container} rounded-md border border-border bg-muted/40 flex items-center justify-center`}
      aria-hidden
    >
      <FiImage className="h-4 w-4 text-muted-foreground/50" />
    </div>
  );
}

/** Small lazy-loaded cover preview for dashboard list rows and cards. */
export default function PostCoverThumbnail({ src, title, size = "sm" }: PostCoverThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() ?? "";
  const { width, height, container } = POST_COVER_THUMB[size];

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  if (!trimmed || failed) {
    return <CoverPlaceholder size={size} />;
  }

  return (
    <LazyImage
      src={trimmed}
      alt={SYNC_LABEL.POST_COVER_ALT(title)}
      width={width}
      height={height}
      viewportLazy
      rootMargin="0px"
      className="h-full w-full object-cover"
      containerClassName={`${container} rounded-md border border-border`}
      skeletonClassName="absolute inset-0 rounded-md"
      onImageError={() => setFailed(true)}
    />
  );
}
